export function FieldErrors({ errors }: { errors?: string[] }) {
  if (!errors || errors.length === 0) return null
  return (
    <span className="text-xs text-red-400 mt-1 block" role="alert">
      {errors[0]}
    </span>
  )
}

export function getFieldErrors(fieldName: string, fieldErrors?: Record<string, string[]>): string[] | undefined {
  return fieldErrors?.[fieldName]
}
