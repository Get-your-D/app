// UI Components - shadcn/ui exports
export {
    Button,
    buttonVariants,
    type ButtonProps,
} from './components/ui/button';
export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './components/ui/card';
export {
    Dialog,
    DialogPortal,
    DialogTrigger,
    DialogClose,
    DialogContent,
    DialogHeader,
    DialogFooter,
    DialogTitle,
    DialogDescription,
} from './components/ui/dialog';
export { Input } from './components/ui/input';
export { Label } from './components/ui/label';
export {
    Select,
    SelectGroup,
    SelectValue,
    SelectTrigger,
    SelectContent,
    SelectLabel,
    SelectItem,
    SelectSeparator,
    SelectScrollUpButton,
    SelectScrollDownButton,
} from './components/ui/select';
export {
    Table,
    TableHeader,
    TableBody,
    TableFooter,
    TableHead,
    TableRow,
    TableCell,
} from './components/ui/table';
export {
    Sidebar,
    SidebarProvider,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarSeparator,
    SidebarTrigger,
    SidebarRail,
    SidebarInset,
    SidebarInput,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupAction,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarMenuAction,
    SidebarMenuBadge,
    SidebarMenuSkeleton,
    SidebarMenuSub,
    SidebarMenuSubItem,
} from './components/ui/sidebar';
export {
    Sheet,
    SheetPortal,
    SheetTrigger,
    SheetVerlay,
    SheetContent,
    SheetHeader,
    SheetFooter,
    SheetTitle,
    SheetDescription,
    SheetClose,
} from './components/ui/sheet';
export { Skeleton } from './components/ui/skeleton';
export { Spinner } from './components/ui/spinner';
export { Switch } from './components/ui/switch';
export {
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
} from './components/ui/tabs';
export { Textarea } from './components/ui/textarea';
export {
    Toast,
    ToastAction,
    ToastClose,
    ToastDescription,
    ToastProvider,
    ToastTitle,
    ToastViewport,
    useToast,
} from './components/ui/sonner';
export {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
    TooltipProvider,
} from './components/ui/tooltip';
export { Badge } from './components/ui/badge';
export { Checkbox } from './components/ui/checkbox';
export { RadioGroup, RadioGroupItem } from './components/ui/radio-group';

// Compliance Components
export { ConsentBanner } from './components/ConsentBanner';
export { AppointmentConsentForm } from './components/AppointmentConsentForm';
export { AuditTrailViewer } from './components/AuditTrailViewer';

// Hooks
export { useMobile } from './hooks/use-mobile';
export { useAuth } from './hooks/use-auth';
export { usePatientRecords } from './hooks/use-patient-records';
export { useAppointments } from './hooks/use-appointments';

// Utilities
export { cn } from './lib/utils';

// Version
export const webSharedVersion = '1.0.0';
