import fs from "node:fs"
import { promises as fsp } from "node:fs"
import path from "node:path"
import { spawn } from "node:child_process"
import { fileURLToPath } from "node:url"

export const ROOT = path.resolve(fileURLToPath(new URL("../..", import.meta.url)))
export const CONFIG_PATH = path.join(ROOT, ".nox", "motion-foundry.json")
// Untracked per-checkout override. Lets a fork publish to its own GitHub repo
// and Vercel project without editing (and later conflicting on) the shared
// baseline config.
export const LOCAL_CONFIG_PATH = path.join(ROOT, ".nox", "motion-foundry.local.json")

const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".json"])
const RESOLVABLE_EXTENSIONS = ["", ".tsx", ".ts", ".jsx", ".js", ".json"]
const IGNORED_DIRECTORIES = new Set([
    ".git",
    ".vercel",
    "node_modules",
    "dist",
    "coverage",
    "reports",
    "test-results",
    "playwright-report",
])

const GENERIC_ID_PARTS = new Set([
    "nox",
    "premium",
    "bg",
    "forms",
    "canvasui",
    "skilltree",
    "scroll",
    "cursor",
    "img2threejs",
    "effect",
])

export async function readJson(filePath) {
    const raw = await fsp.readFile(filePath, "utf8")
    return JSON.parse(raw.replace(/^\uFEFF/, ""))
}

export async function writeJson(filePath, value) {
    await fsp.mkdir(path.dirname(filePath), { recursive: true })
    await fsp.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8")
}

// Shallow merge, one level deep for the nested `vercel` and `publishGuard`
// objects. Deliberately not a generic deep merge: the override should stay
// readable as "these keys point somewhere else in this checkout".
function mergeConfig(base, override) {
    const merged = { ...base, ...override }
    for (const key of ["vercel", "publishGuard"]) {
        if (base?.[key] || override?.[key]) {
            merged[key] = { ...(base?.[key] ?? {}), ...(override?.[key] ?? {}) }
        }
    }
    return merged
}

export async function loadConfig() {
    let config = await readJson(CONFIG_PATH)
    if (fs.existsSync(LOCAL_CONFIG_PATH)) {
        const local = await readJson(LOCAL_CONFIG_PATH)
        config = mergeConfig(config, local)
        config.configSource = "baseline + .nox/motion-foundry.local.json"
    } else {
        config.configSource = "baseline"
    }
    if (config?.schemaVersion !== "1.0.0") {
        throw new Error(`Unsupported Motion Foundry config version: ${config?.schemaVersion ?? "missing"}`)
    }
    if (!config?.vercel?.projectId || !config?.vercel?.productionDomain) {
        throw new Error("Motion Foundry config is missing the Vercel production target")
    }
    return config
}

export function resolveBatchPath(input = "batches/example-motion-batch.json") {
    const candidate = path.resolve(ROOT, input)
    assertInside(ROOT, candidate, "Batch path")
    return candidate
}

export async function loadBatch(input) {
    const batchPath = resolveBatchPath(input)
    const batch = await readJson(batchPath)
    const errors = validateBatch(batch)
    if (errors.length > 0) {
        throw new Error(`Invalid Motion Foundry batch:\n- ${errors.join("\n- ")}`)
    }
    return { batch, batchPath }
}

export function effectIdFromUrl(value) {
    if (typeof value !== "string" || value.trim() === "") return null
    const raw = value.trim()

    const routeMatch = raw.match(/(?:#|^)\/?(?:.*?\/)?effect\/([^/?#]+)/i)
    if (routeMatch) return decodeURIComponent(routeMatch[1])

    try {
        const parsed = new URL(raw)
        const combined = `${parsed.pathname}${parsed.hash}`
        const match = combined.match(/\/effect\/([^/?#]+)/i)
        if (match) return decodeURIComponent(match[1])
    } catch {
        // Plain effect IDs are valid input.
    }

    if (/^[a-z0-9][a-z0-9-]*$/i.test(raw)) return raw
    return null
}

export function resolveEffectId(effect) {
    return effectIdFromUrl(effect?.id) ?? effectIdFromUrl(effect?.url)
}

export function validateBatch(batch) {
    const errors = []
    if (!batch || typeof batch !== "object" || Array.isArray(batch)) {
        return ["Batch must be a JSON object"]
    }
    if (batch.schemaVersion !== "1.0") errors.push('schemaVersion must equal "1.0"')
    if (typeof batch.id !== "string" || !/^[a-z0-9][a-z0-9-]*$/.test(batch.id)) {
        errors.push("id must use lowercase letters, numbers and hyphens")
    }
    if (!Array.isArray(batch.effects) || batch.effects.length === 0) {
        errors.push("effects must contain at least one effect")
        return errors
    }

    const seen = new Set()
    batch.effects.forEach((effect, index) => {
        const prefix = `effects[${index}]`
        const id = resolveEffectId(effect)
        if (!id) errors.push(`${prefix} must provide a valid id or effect URL`)
        if (id && seen.has(id)) errors.push(`${prefix} duplicates effect ${id}`)
        if (id) seen.add(id)
        if (effect.variants != null && !isStringArray(effect.variants)) {
            errors.push(`${prefix}.variants must be an array of strings`)
        }
        if (effect.brandKits != null && !isStringArray(effect.brandKits)) {
            errors.push(`${prefix}.brandKits must be an array of strings`)
        }
        if (effect.constraints != null && !isStringArray(effect.constraints)) {
            errors.push(`${prefix}.constraints must be an array of strings`)
        }
        if (effect.files != null && !isStringArray(effect.files)) {
            errors.push(`${prefix}.files must be an array of repository-relative paths`)
        }
        if (effect.dependencies != null && !isStringArray(effect.dependencies)) {
            errors.push(`${prefix}.dependencies must be an array of package names`)
        }
    })

    if (batch.publish?.skipPreview !== true) {
        errors.push("publish.skipPreview must be true for the direct-production workflow")
    }
    if (batch.publish?.mode !== "production") {
        errors.push('publish.mode must equal "production"')
    }
    return errors
}

export async function walkFiles(startDirectory, options = {}) {
    const extensions = options.extensions ?? SOURCE_EXTENSIONS
    const output = []

    async function visit(directory) {
        const entries = await fsp.readdir(directory, { withFileTypes: true })
        for (const entry of entries) {
            if (entry.name.startsWith(".") && entry.name !== ".nox") continue
            const absolute = path.join(directory, entry.name)
            if (entry.isDirectory()) {
                if (!IGNORED_DIRECTORIES.has(entry.name)) await visit(absolute)
                continue
            }
            if (!extensions || extensions.has(path.extname(entry.name).toLowerCase())) {
                output.push(absolute)
            }
        }
    }

    await visit(startDirectory)
    return output
}

export async function discoverEffect(effect, sourceRoot = path.join(ROOT, "src", "motion-arsenal")) {
    const id = resolveEffectId(effect)
    if (!id) throw new Error("Cannot discover an effect without a valid ID")

    if (Array.isArray(effect.files) && effect.files.length > 0) {
        const explicit = effect.files.map((file) => normalizeRepositoryPath(file))
        const missing = explicit.filter((file) => !fs.existsSync(path.join(ROOT, file)))
        return {
            id,
            source: "explicit",
            componentFiles: explicit,
            catalogFiles: [],
            matchedFiles: explicit,
            warnings: missing.map((file) => `Configured file does not exist: ${file}`),
        }
    }

    const files = await walkFiles(sourceRoot)
    const matchedFiles = []
    const catalogFiles = new Set()
    const componentFiles = new Set()
    const warnings = []
    const idParts = id
        .split("-")
        .filter((part) => part.length > 2 && !GENERIC_ID_PARTS.has(part.toLowerCase()))

    for (const absolute of files) {
        let content
        try {
            content = await fsp.readFile(absolute, "utf8")
        } catch {
            continue
        }

        const relative = toRepositoryPath(absolute)
        const basename = path.basename(relative, path.extname(relative)).toLowerCase()
        const containsId = content.includes(id)
        const basenameMatch = idParts.some((part) => basename.includes(part.toLowerCase()))
        if (!containsId && !basenameMatch) continue

        matchedFiles.push(relative)
        if (/catalog|registry|manifest/i.test(relative) || containsId) {
            catalogFiles.add(relative)
        }

        if (basenameMatch && !/catalog|registry|manifest|test/i.test(relative)) {
            componentFiles.add(relative)
        }

        if (containsId) {
            const importMap = parseImports(content)
            for (const index of allIndexes(content, id)) {
                const window = content.slice(Math.max(0, index - 800), index + 3200)
                for (const [identifier, importPath] of importMap.entries()) {
                    if (!new RegExp(`\\b${escapeRegex(identifier)}\\b`).test(window)) continue
                    const resolved = resolveImportFile(absolute, importPath)
                    if (resolved && resolved.startsWith(sourceRoot)) {
                        componentFiles.add(toRepositoryPath(resolved))
                    }
                }
            }
        }
    }

    const components = [...componentFiles].sort()
    if (components.length === 0) {
        warnings.push(
            `No implementation file was resolved automatically for ${id}; add an explicit files array to the batch entry`,
        )
    }

    return {
        id,
        source: "discovered",
        componentFiles: components,
        catalogFiles: [...catalogFiles].sort(),
        matchedFiles: matchedFiles.sort(),
        warnings,
    }
}

export async function buildPlan(batch, batchPath) {
    const effects = []
    for (const effect of batch.effects) {
        const discovery = await discoverEffect(effect)
        effects.push({
            id: discovery.id,
            url: effect.url ?? null,
            intent: effect.intent ?? null,
            variants: effect.variants ?? [],
            brandKits: effect.brandKits ?? [],
            constraints: effect.constraints ?? [],
            dependencies: effect.dependencies ?? [],
            ...discovery,
        })
    }

    return {
        schemaVersion: "1.0",
        batchId: batch.id,
        batchFile: toRepositoryPath(batchPath),
        generatedAt: new Date().toISOString(),
        publish: batch.publish,
        effects,
        summary: {
            effectCount: effects.length,
            resolvedEffectCount: effects.filter((effect) => effect.componentFiles.length > 0).length,
            warningCount: effects.reduce((sum, effect) => sum + effect.warnings.length, 0),
        },
    }
}

export function renderPlanMarkdown(plan) {
    const lines = [
        `# Motion Foundry Batch: ${plan.batchId}`,
        "",
        `- Effects: ${plan.summary.effectCount}`,
        `- Resolved: ${plan.summary.resolvedEffectCount}`,
        `- Warnings: ${plan.summary.warningCount}`,
        `- Publish mode: ${plan.publish.mode}`,
        `- Preview skipped: ${plan.publish.skipPreview ? "yes" : "no"}`,
        "",
    ]

    for (const effect of plan.effects) {
        lines.push(`## ${effect.id}`, "")
        if (effect.intent) lines.push(`**Intent:** ${effect.intent}`, "")
        lines.push(`**Implementation files:** ${effect.componentFiles.length ? "" : "none resolved"}`)
        for (const file of effect.componentFiles) lines.push(`- \`${file}\``)
        if (effect.variants.length) lines.push("", `**Variants:** ${effect.variants.join(", ")}`)
        if (effect.brandKits.length) lines.push(`**Brand kits:** ${effect.brandKits.join(", ")}`)
        if (effect.warnings.length) {
            lines.push("", "**Warnings:**")
            for (const warning of effect.warnings) lines.push(`- ${warning}`)
        }
        lines.push("")
    }

    return `${lines.join("\n")}\n`
}

export async function runCommand(command, options = {}) {
    const cwd = options.cwd ?? ROOT
    const env = { ...process.env, ...(options.env ?? {}) }
    const capture = options.capture === true

    return new Promise((resolve, reject) => {
        const child = spawn(command, {
            cwd,
            env,
            shell: true,
            stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit",
        })
        let stdout = ""
        let stderr = ""
        if (capture) {
            child.stdout?.on("data", (chunk) => (stdout += chunk.toString()))
            child.stderr?.on("data", (chunk) => (stderr += chunk.toString()))
        }
        child.on("error", reject)
        child.on("close", (code) => {
            if (code === 0) {
                resolve({ code, stdout: stdout.trim(), stderr: stderr.trim() })
                return
            }
            const detail = capture ? `\n${stderr || stdout}` : ""
            reject(new Error(`Command failed (${code}): ${command}${detail}`))
        })
    })
}

export async function verifyPublishTarget(config) {
    const guard = config.publishGuard
    const actualGo = process.env[guard.requiredEnv]
    if (actualGo !== guard.requiredValue) {
        throw new Error(
            `Production deploy blocked: set ${guard.requiredEnv}=${guard.requiredValue} after Operator-GO`,
        )
    }

    if (guard.requireCleanGit) {
        const status = await runCommand("git status --porcelain", { capture: true })
        if (status.stdout) throw new Error("Production deploy blocked: git working tree is not clean")
    }

    if (guard.requireProductionBranch) {
        const branch = await runCommand("git branch --show-current", { capture: true })
        if (branch.stdout !== config.productionBranch) {
            throw new Error(
                `Production deploy blocked: current branch is ${branch.stdout || "unknown"}, expected ${config.productionBranch}`,
            )
        }
    }

    if (guard.requireLinkedProject) {
        const linkPath = path.join(ROOT, ".vercel", "project.json")
        if (!fs.existsSync(linkPath)) {
            throw new Error(
                "Production deploy blocked: .vercel/project.json is missing. Link this checkout to the existing nox-motion-arsenal project once.",
            )
        }
        const linked = await readJson(linkPath)
        if (linked.projectId !== config.vercel.projectId || linked.orgId !== config.vercel.teamId) {
            throw new Error(
                `Production deploy blocked: linked Vercel target is ${linked.orgId}/${linked.projectId}, expected ${config.vercel.teamId}/${config.vercel.projectId}`,
            )
        }
    }
}

export async function smokeProduction(config) {
    const response = await fetch(config.vercel.productionDomain, {
        redirect: "follow",
        headers: { "user-agent": "NOX-Motion-Foundry/1.0" },
    })
    if (!response.ok) {
        throw new Error(`Production smoke failed: HTTP ${response.status} at ${config.vercel.productionDomain}`)
    }
    return {
        url: response.url,
        status: response.status,
        checkedAt: new Date().toISOString(),
    }
}

export function toRepositoryPath(absolute) {
    return path.relative(ROOT, absolute).split(path.sep).join("/")
}

export function normalizeRepositoryPath(value) {
    if (typeof value !== "string" || value.trim() === "") {
        throw new Error("Repository path must be a non-empty string")
    }
    const normalized = value.replaceAll("\\", "/").replace(/^\.\//, "")
    const absolute = path.resolve(ROOT, normalized)
    assertInside(ROOT, absolute, "Repository path")
    return toRepositoryPath(absolute)
}

export function assertInside(parent, child, label = "Path") {
    const relative = path.relative(parent, child)
    if (relative.startsWith("..") || path.isAbsolute(relative)) {
        throw new Error(`${label} escapes its allowed root`)
    }
}

function parseImports(content) {
    const imports = new Map()
    const regex = /import\s+(?:type\s+)?([^;]+?)\s+from\s+["']([^"']+)["']/g
    let match
    while ((match = regex.exec(content))) {
        const clause = match[1].trim()
        const source = match[2]
        if (!source.startsWith(".")) continue

        const defaultMatch = clause.match(/^([A-Za-z_$][\w$]*)/)
        if (defaultMatch) imports.set(defaultMatch[1], source)

        const namedMatch = clause.match(/\{([^}]+)\}/)
        if (namedMatch) {
            for (const entry of namedMatch[1].split(",")) {
                const cleaned = entry.trim().replace(/^type\s+/, "")
                if (!cleaned) continue
                const parts = cleaned.split(/\s+as\s+/)
                imports.set((parts[1] ?? parts[0]).trim(), source)
            }
        }

        const namespaceMatch = clause.match(/\*\s+as\s+([A-Za-z_$][\w$]*)/)
        if (namespaceMatch) imports.set(namespaceMatch[1], source)
    }
    return imports
}

function resolveImportFile(importer, source) {
    const base = path.resolve(path.dirname(importer), source)
    const candidates = []
    for (const extension of RESOLVABLE_EXTENSIONS) candidates.push(`${base}${extension}`)
    for (const extension of RESOLVABLE_EXTENSIONS.slice(1)) {
        candidates.push(path.join(base, `index${extension}`))
    }
    return candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile()) ?? null
}

function allIndexes(content, needle) {
    const output = []
    let cursor = 0
    while (cursor < content.length) {
        const index = content.indexOf(needle, cursor)
        if (index < 0) break
        output.push(index)
        cursor = index + needle.length
    }
    return output
}

function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function isStringArray(value) {
    return Array.isArray(value) && value.every((item) => typeof item === "string" && item.trim() !== "")
}
