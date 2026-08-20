import FormSignalSystem, {
  type FormSignalSystemProps,
  type ValidationPulseVariant,
} from './FormSignalSystem';

export type { ValidationPulseVariant };

/**
 * Legacy compatibility wrapper for saved imports.
 * Use FormSignalSystem for new work; its catalog entry is now canonical.
 */
export type ValidationPulseProps = FormSignalSystemProps;

export function ValidationPulse(props: ValidationPulseProps) {
  return <FormSignalSystem {...props} />;
}

export default ValidationPulse;
