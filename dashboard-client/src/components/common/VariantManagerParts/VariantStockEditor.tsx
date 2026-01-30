import { Button } from '../Button'
import { Input } from '../Input'

interface VariantStockEditorProps {
  value: string
  onChange: (value: string) => void
  onSave: () => void
  onCancel: () => void
  isSaving?: boolean
}

export function VariantStockEditor({
  value,
  onChange,
  onSave,
  onCancel,
  isSaving = false,
}: VariantStockEditorProps) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSave()
          if (e.key === 'Escape') onCancel()
        }}
        min="0"
        step="1"
        className="!py-1 !px-2 text-sm text-right w-20"
        autoFocus
      />
      <Button variant="ghost" size="sm" onClick={onCancel} className="!p-1">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </Button>
      <Button variant="primary" size="sm" onClick={onSave} loading={isSaving} className="!p-1">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </Button>
    </div>
  )
}
