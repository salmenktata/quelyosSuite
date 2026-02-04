// Components UI réutilisables
export { Button } from './Button'
export type { ButtonProps } from './Button'

export { Badge } from './Badge'
export type { BadgeProps } from './Badge'

export { Input } from './Input'
export type { InputProps } from './Input'

export { SearchAutocomplete } from './SearchAutocomplete'
export type { SearchAutocompleteProps, SearchSuggestion } from './SearchAutocomplete'

export { Modal } from './Modal'
export type { ModalProps } from './Modal'

export { ConfirmModal } from './ConfirmModal'
export type { ConfirmModalProps } from './ConfirmModal'

export { Toast, ToastContainer } from './Toast'
export type { ToastProps, ToastContainerProps, ToastType } from './Toast'

export { Skeleton, SkeletonTable, SkeletonCard, SkeletonGrid, SkeletonKPI, SkeletonTree, SkeletonChart } from './Skeleton'
export type { SkeletonProps } from './Skeleton'

export { DateRangePicker } from './DateRangePicker'
export type { DateRange } from './DateRangePicker'

export { Table } from './Table'
export type { TableProps, Column, SortDirection } from './Table'

export { Breadcrumbs } from './Breadcrumbs'
export type { BreadcrumbsProps, BreadcrumbItem } from './Breadcrumbs'

export { BackendImage } from './BackendImage'

export { ImageGallery } from './ImageGallery'
export type { ProductImage, ImageGalleryProps } from './ImageGallery'

export { VariantManager } from './VariantManager'

export { AttributeValueImageGallery } from './AttributeValueImageGallery'

export { AttributeImageManager } from './AttributeImageManager'

export { ImportProductsModal } from './ImportProductsModal'

export { CategoryTree } from './CategoryTree'

export { AttributeFilter } from './AttributeFilter'
export type { Attribute, AttributeValue, AttributeFilterProps } from './AttributeFilter'

export { DataTable } from './DataTable'
export type { DataTableProps, DataTableColumn, BulkAction, MobileCardConfig } from './DataTable'

export { ImageUpload } from './ImageUpload'
export type { ImageUploadProps } from './ImageUpload'

export { ErrorAlert } from './ErrorAlert'

export { ErrorBoundary } from './ErrorBoundary'
export { ModuleErrorBoundary } from './ModuleErrorBoundary'

export { PageNotice } from './PageNotice'

export { NotificationCenter, NotificationIcon, NotificationSidebar } from './NotificationCenter'
export type { NotificationCenterProps } from './NotificationCenter'

export { ReadOnlyProvider, ReadOnlyBanner, ReadOnlyBlock, useReadOnly } from './ReadOnlyGuard'

export { EmailTemplatePreview } from './EmailTemplatePreview'
export type { EmailTemplatePreviewProps } from './EmailTemplatePreview'

export { MerchantChecklist } from './MerchantChecklist'
export type { MerchantChecklistProps } from './MerchantChecklist'

export { GuidedTours, useGuidedTour, shouldShowTour } from './GuidedTours'
export type { GuidedToursProps, TourId } from './GuidedTours'

export {
  CustomerImpactTooltip,
  ImpactTooltip,
  PreviewTooltip,
  InfoTooltip,
} from './CustomerImpactTooltip'
export type { CustomerImpactTooltipProps, TooltipPosition, TooltipVariant } from './CustomerImpactTooltip'
