export function FieldErrors({ errors, id }: { errors?: string[]; id?: string }) {
  if (!errors || errors.length === 0) return null
  return (
    <span id={id} className="text-xs text-destructive mt-1 block" role="alert">
      {errors[0]}
    </span>
  )
}

export function getFieldErrors(fieldName: string, fieldErrors?: Record<string, string[]>): string[] | undefined {
  return fieldErrors?.[fieldName]
}
