import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
} from '@/components/ui/chart';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut
} from '@/components/ui/command';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger
} from '@/components/ui/context-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger
} from '@/components/ui/drawer';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@/components/ui/input-otp';
import { Label } from '@/components/ui/label';
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger
} from '@/components/ui/menubar';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle
} from '@/components/ui/navigation-menu';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger
} from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Toggle } from '@/components/ui/toggle';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Bell,
  Bold,
  Calendar as CalendarIcon,
  ChevronDown,
  Italic,
  Mail,
  Settings,
  Star,
  Underline
} from 'lucide-react';
import { FC, ReactNode, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

/* -------------------------------------------------------------------------- */
/*  Page scaffolding                                                          */
/* -------------------------------------------------------------------------- */

const Section: FC<{ id: string; title: string; description?: string; children: ReactNode }> = ({
  id,
  title,
  description,
  children
}) => (
  <section id={id} className="scroll-mt-6 space-y-3">
    <div>
      <h2 className="text-xl font-bold text-accent-900">{title}</h2>
      {description && <p className="text-sm text-accent-700">{description}</p>}
    </div>
    <div className="rounded-lg border bg-card p-6 text-card-foreground">{children}</div>
  </section>
);

const TOC_GROUPS: { label: string; items: { id: string; label: string }[] }[] = [
  {
    label: 'Buttons & input',
    items: [
      { id: 'button', label: 'Button' },
      { id: 'toggle', label: 'Toggle' },
      { id: 'toggle-group', label: 'Toggle Group' },
      { id: 'input', label: 'Input' },
      { id: 'textarea', label: 'Textarea' },
      { id: 'label', label: 'Label' },
      { id: 'checkbox', label: 'Checkbox' },
      { id: 'radio-group', label: 'Radio Group' },
      { id: 'switch', label: 'Switch' },
      { id: 'slider', label: 'Slider' },
      { id: 'select', label: 'Select' },
      { id: 'input-otp', label: 'Input OTP' },
      { id: 'form', label: 'Form' },
      { id: 'calendar', label: 'Calendar' }
    ]
  },
  {
    label: 'Layout',
    items: [
      { id: 'card', label: 'Card' },
      { id: 'separator', label: 'Separator' },
      { id: 'aspect-ratio', label: 'Aspect Ratio' },
      { id: 'skeleton', label: 'Skeleton' },
      { id: 'resizable', label: 'Resizable' },
      { id: 'scroll-area', label: 'Scroll Area' },
      { id: 'collapsible', label: 'Collapsible' }
    ]
  },
  {
    label: 'Navigation',
    items: [
      { id: 'tabs', label: 'Tabs' },
      { id: 'accordion', label: 'Accordion' },
      { id: 'breadcrumb', label: 'Breadcrumb' },
      { id: 'pagination', label: 'Pagination' },
      { id: 'navigation-menu', label: 'Navigation Menu' },
      { id: 'menubar', label: 'Menubar' },
      { id: 'sidebar', label: 'Sidebar' },
      { id: 'command', label: 'Command' }
    ]
  },
  {
    label: 'Overlays',
    items: [
      { id: 'dialog', label: 'Dialog' },
      { id: 'alert-dialog', label: 'Alert Dialog' },
      { id: 'sheet', label: 'Sheet' },
      { id: 'drawer', label: 'Drawer' },
      { id: 'popover', label: 'Popover' },
      { id: 'hover-card', label: 'Hover Card' },
      { id: 'tooltip', label: 'Tooltip' },
      { id: 'context-menu', label: 'Context Menu' }
    ]
  },
  {
    label: 'Feedback & data',
    items: [
      { id: 'alert', label: 'Alert' },
      { id: 'badge', label: 'Badge' },
      { id: 'progress', label: 'Progress' },
      { id: 'sonner', label: 'Sonner Toast' },
      { id: 'avatar', label: 'Avatar' },
      { id: 'table', label: 'Table' },
      { id: 'carousel', label: 'Carousel' },
      { id: 'chart', label: 'Chart' }
    ]
  }
];

/* -------------------------------------------------------------------------- */
/*  Sub-examples that need state                                              */
/* -------------------------------------------------------------------------- */

const formSchema = z.object({
  username: z.string().min(2, 'Must be at least 2 characters.'),
  email: z.string().email('Must be a valid email.')
});

const FormExample: FC = () => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { username: '', email: '' }
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(values => toast.success(`Submitted as ${values.username}`))}
        className="w-full max-w-sm space-y-4"
      >
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="alveus_fan" {...field} />
              </FormControl>
              <FormDescription>This is how you appear in the leaderboard.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="you@alveus.gg" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
};

const CalendarExample: FC = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  return <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md border bg-background" />;
};

const SliderExample: FC = () => {
  const [value, setValue] = useState<number[]>([42]);
  return (
    <div className="w-72 space-y-2">
      <Slider value={value} onValueChange={setValue} max={100} step={1} />
      <p className="text-sm text-muted-foreground">Value: {value[0]}</p>
    </div>
  );
};

const ProgressExample: FC = () => {
  const [value, setValue] = useState(45);
  return (
    <div className="w-72 space-y-2">
      <Progress value={value} />
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => setValue(v => Math.max(0, v - 10))}>
          -10
        </Button>
        <Button size="sm" variant="outline" onClick={() => setValue(v => Math.min(100, v + 10))}>
          +10
        </Button>
        <span className="self-center text-sm text-muted-foreground">{value}%</span>
      </div>
    </div>
  );
};

const InputOTPExample: FC = () => {
  const [value, setValue] = useState('');
  return (
    <div className="space-y-2">
      <InputOTP maxLength={6} value={value} onChange={setValue}>
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
        </InputOTPGroup>
        <InputOTPSeparator />
        <InputOTPGroup>
          <InputOTPSlot index={3} />
          <InputOTPSlot index={4} />
          <InputOTPSlot index={5} />
        </InputOTPGroup>
      </InputOTP>
      <p className="text-sm text-muted-foreground">Code: {value || '—'}</p>
    </div>
  );
};

const ChartExample: FC = () => {
  const data = [
    { month: 'Jan', sightings: 186, captures: 80 },
    { month: 'Feb', sightings: 305, captures: 200 },
    { month: 'Mar', sightings: 237, captures: 120 },
    { month: 'Apr', sightings: 273, captures: 190 },
    { month: 'May', sightings: 209, captures: 130 },
    { month: 'Jun', sightings: 264, captures: 170 }
  ];
  const config = {
    sightings: { label: 'Sightings', color: 'hsl(var(--chart-1))' },
    captures: { label: 'Captures', color: 'hsl(var(--chart-3))' }
  } satisfies ChartConfig;

  return (
    <ChartContainer config={config} className="h-64 w-full max-w-2xl">
      <RechartsBarChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
        <RechartsCartesianGrid vertical={false} strokeDasharray="3 3" />
        <RechartsXAxis dataKey="month" tickLine={false} axisLine={false} />
        <RechartsYAxis tickLine={false} axisLine={false} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dashed" />} />
        <ChartLegend content={<ChartLegendContent />} />
        <RechartsBar dataKey="sightings" fill="var(--color-sightings)" radius={4} />
        <RechartsBar dataKey="captures" fill="var(--color-captures)" radius={4} />
      </RechartsBarChart>
    </ChartContainer>
  );
};

import {
  Bar as RechartsBar,
  BarChart as RechartsBarChart,
  CartesianGrid as RechartsCartesianGrid,
  XAxis as RechartsXAxis,
  YAxis as RechartsYAxis
} from 'recharts';

const SidebarExample: FC = () => (
  <SidebarProvider className="min-h-[20rem] overflow-hidden rounded-md border" defaultOpen>
    <Sidebar collapsible="none" className="border-r">
      <SidebarHeader>
        <div className="px-2 py-1 text-sm font-semibold">Census</div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {[
                { label: 'Home', icon: Star },
                { label: 'Inbox', icon: Mail },
                { label: 'Calendar', icon: CalendarIcon },
                { label: 'Settings', icon: Settings }
              ].map(item => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton>
                    <item.icon /> <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <span className="px-2 text-xs text-sidebar-foreground/70">v0.0.0</span>
      </SidebarFooter>
    </Sidebar>
    <SidebarInset className="bg-background">
      <header className="flex h-12 items-center gap-2 border-b px-4">
        <SidebarTrigger />
        <span className="text-sm font-medium">Sidebar inset content</span>
      </header>
      <div className="p-4 text-sm text-muted-foreground">
        The sidebar lives inside its own SidebarProvider so this preview is self-contained.
      </div>
    </SidebarInset>
  </SidebarProvider>
);

/* -------------------------------------------------------------------------- */
/*  Main page                                                                 */
/* -------------------------------------------------------------------------- */

export const Components: FC = () => (
  <TooltipProvider>
    <div className="-mx-8 -my-6 flex min-h-full gap-8 bg-accent-50 px-8 py-8">
      <aside className="sticky top-8 hidden h-[calc(100svh-6rem)] w-56 flex-shrink-0 overflow-y-auto pr-2 lg:block">
        <h1 className="mb-4 text-lg font-bold text-accent-900">Components</h1>
        <nav className="space-y-4 text-sm">
          {TOC_GROUPS.map(group => (
            <div key={group.label}>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-accent-700">{group.label}</p>
              <ul className="space-y-0.5">
                {group.items.map(item => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className="block rounded px-2 py-1 text-accent-900 transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 flex-1 space-y-10">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold text-accent-900 lg:hidden">shadcn components</h1>
          <p className="max-w-2xl text-sm text-accent-800">
            One example of every shadcn primitive in <code>src/components/ui</code>. The shadcn CSS variables are wired
            to the warm Alveus accent ramp, so primary/secondary/border/ring all inherit the project palette
            automatically — the existing <code>accent-50..950</code> Tailwind ramp continues to work alongside.
          </p>
        </header>

        {/* Buttons & input */}
        <Section id="button" title="Button" description="Six variants × four sizes.">
          <div className="flex flex-wrap items-center gap-2">
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
            <Button variant="destructive">Destructive</Button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
            <Button size="icon" aria-label="Bell">
              <Bell />
            </Button>
            <Button disabled>Disabled</Button>
          </div>
        </Section>

        <Section id="toggle" title="Toggle" description="A two-state pressed button.">
          <div className="flex gap-2">
            <Toggle aria-label="Bold">
              <Bold />
            </Toggle>
            <Toggle variant="outline" aria-label="Italic">
              <Italic />
            </Toggle>
          </div>
        </Section>

        <Section id="toggle-group" title="Toggle Group" description="Single- and multi-select toggle bars.">
          <ToggleGroup type="multiple">
            <ToggleGroupItem value="bold" aria-label="Bold">
              <Bold />
            </ToggleGroupItem>
            <ToggleGroupItem value="italic" aria-label="Italic">
              <Italic />
            </ToggleGroupItem>
            <ToggleGroupItem value="underline" aria-label="Underline">
              <Underline />
            </ToggleGroupItem>
          </ToggleGroup>
        </Section>

        <Section id="input" title="Input">
          <Input className="max-w-sm" placeholder="Search observations…" />
        </Section>

        <Section id="textarea" title="Textarea">
          <Textarea className="max-w-md" placeholder="Add a note about this capture…" rows={4} />
        </Section>

        <Section id="label" title="Label" description="Paired with a checkbox via htmlFor.">
          <div className="flex items-center gap-2">
            <Checkbox id="terms" />
            <Label htmlFor="terms">Accept terms and conditions</Label>
          </div>
        </Section>

        <Section id="checkbox" title="Checkbox">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Checkbox id="sub-1" defaultChecked />
              <Label htmlFor="sub-1">Subscribe to weekly digest</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="sub-2" disabled />
              <Label htmlFor="sub-2">Disabled option</Label>
            </div>
          </div>
        </Section>

        <Section id="radio-group" title="Radio Group">
          <RadioGroup defaultValue="comfortable" className="flex flex-col gap-2">
            {[
              { value: 'compact', label: 'Compact' },
              { value: 'comfortable', label: 'Comfortable' },
              { value: 'spacious', label: 'Spacious' }
            ].map(opt => (
              <div key={opt.value} className="flex items-center gap-2">
                <RadioGroupItem value={opt.value} id={`rg-${opt.value}`} />
                <Label htmlFor={`rg-${opt.value}`}>{opt.label}</Label>
              </div>
            ))}
          </RadioGroup>
        </Section>

        <Section id="switch" title="Switch">
          <div className="flex items-center gap-2">
            <Switch id="airplane" />
            <Label htmlFor="airplane">Airplane mode</Label>
          </div>
        </Section>

        <Section id="slider" title="Slider">
          <SliderExample />
        </Section>

        <Section id="select" title="Select">
          <Select>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Pick a season" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Seasons</SelectLabel>
                <SelectItem value="spring">Spring</SelectItem>
                <SelectItem value="summer">Summer</SelectItem>
                <SelectItem value="autumn">Autumn</SelectItem>
                <SelectItem value="winter">Winter</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </Section>

        <Section id="input-otp" title="Input OTP">
          <InputOTPExample />
        </Section>

        <Section id="form" title="Form" description="React Hook Form + zod, with FormField/FormMessage wiring.">
          <FormExample />
        </Section>

        <Section id="calendar" title="Calendar">
          <CalendarExample />
        </Section>

        {/* Layout */}
        <Section id="card" title="Card">
          <Card className="w-80">
            <CardHeader>
              <CardTitle>Capture summary</CardTitle>
              <CardDescription>Today's observations</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">42 species identified across 6 enclosures.</p>
            </CardContent>
            <CardFooter className="justify-end">
              <Button variant="outline" size="sm">
                View report
              </Button>
            </CardFooter>
          </Card>
        </Section>

        <Section id="separator" title="Separator">
          <div className="flex h-12 items-center gap-3 text-sm">
            <span>Drafts</span>
            <Separator orientation="vertical" />
            <span>Published</span>
            <Separator orientation="vertical" />
            <span>Archived</span>
          </div>
          <Separator className="my-4" />
          <p className="text-sm text-muted-foreground">Horizontal separators look like the line above.</p>
        </Section>

        <Section id="aspect-ratio" title="Aspect Ratio" description="Locks content to a fixed ratio (16:9 here).">
          <div className="w-80">
            <AspectRatio ratio={16 / 9} className="overflow-hidden rounded-md bg-accent">
              <div className="flex h-full w-full items-center justify-center text-accent-foreground">16:9 surface</div>
            </AspectRatio>
          </div>
        </Section>

        <Section id="skeleton" title="Skeleton">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </Section>

        <Section id="resizable" title="Resizable">
          <ResizablePanelGroup direction="horizontal" className="h-40 max-w-xl rounded-md border">
            <ResizablePanel defaultSize={25} className="bg-secondary p-3 text-sm">
              Sidebar
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={75} className="p-3 text-sm">
              Main pane — drag the divider.
            </ResizablePanel>
          </ResizablePanelGroup>
        </Section>

        <Section id="scroll-area" title="Scroll Area">
          <ScrollArea className="h-48 w-64 rounded-md border p-4">
            <ul className="space-y-2 text-sm">
              {Array.from({ length: 30 }, (_, i) => (
                <li key={i}>Capture #{i + 1}</li>
              ))}
            </ul>
          </ScrollArea>
        </Section>

        <Section id="collapsible" title="Collapsible">
          <Collapsible className="w-72 space-y-2">
            <div className="flex items-center justify-between gap-2 rounded border bg-secondary px-3 py-2">
              <span className="text-sm font-medium">Recent species</span>
              <CollapsibleTrigger asChild>
                <Button size="sm" variant="ghost">
                  Toggle <ChevronDown className="size-4" />
                </Button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="space-y-1 rounded border px-3 py-2 text-sm">
              <p>American Robin</p>
              <p>Black-capped Chickadee</p>
              <p>Mourning Dove</p>
            </CollapsibleContent>
          </Collapsible>
        </Section>

        {/* Navigation */}
        <Section id="tabs" title="Tabs">
          <Tabs defaultValue="account" className="w-96">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="password">Password</TabsTrigger>
            </TabsList>
            <TabsContent value="account" className="rounded border p-4 text-sm">
              Manage your account details and notification preferences.
            </TabsContent>
            <TabsContent value="password" className="rounded border p-4 text-sm">
              Update your password — must contain at least 8 characters.
            </TabsContent>
          </Tabs>
        </Section>

        <Section id="accordion" title="Accordion">
          <Accordion type="single" collapsible className="w-96">
            <AccordionItem value="item-1">
              <AccordionTrigger>What is Census?</AccordionTrigger>
              <AccordionContent>
                A community-driven biodiversity survey across Alveus Sanctuary streams.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>How do points work?</AccordionTrigger>
              <AccordionContent>
                You earn points for verified identifications. The leaderboard refreshes nightly.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>Can I export my captures?</AccordionTrigger>
              <AccordionContent>Yes — admins can export from the Captures page as CSV.</AccordionContent>
            </AccordionItem>
          </Accordion>
        </Section>

        <Section id="breadcrumb" title="Breadcrumb">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="#">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="#">Captures</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>August 12</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </Section>

        <Section id="pagination" title="Pagination">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#">1</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#" isActive>
                  2
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#">3</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
              <PaginationItem>
                <PaginationNext href="#" />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </Section>

        <Section id="navigation-menu" title="Navigation Menu">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Captures</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[18rem] gap-2 p-3">
                    <li>
                      <NavigationMenuLink className="block rounded px-2 py-1 text-sm hover:bg-accent">
                        Today
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink className="block rounded px-2 py-1 text-sm hover:bg-accent">
                        This week
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink className="block rounded px-2 py-1 text-sm hover:bg-accent">
                        All seasons
                      </NavigationMenuLink>
                    </li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink className={navigationMenuTriggerStyle()} href="#">
                  Identifications
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </Section>

        <Section id="menubar" title="Menubar">
          <Menubar>
            <MenubarMenu>
              <MenubarTrigger>File</MenubarTrigger>
              <MenubarContent>
                <MenubarItem>
                  New capture <MenubarShortcut>⌘N</MenubarShortcut>
                </MenubarItem>
                <MenubarItem>
                  Open… <MenubarShortcut>⌘O</MenubarShortcut>
                </MenubarItem>
                <MenubarSeparator />
                <MenubarItem>Export CSV</MenubarItem>
              </MenubarContent>
            </MenubarMenu>
            <MenubarMenu>
              <MenubarTrigger>Edit</MenubarTrigger>
              <MenubarContent>
                <MenubarItem>
                  Undo <MenubarShortcut>⌘Z</MenubarShortcut>
                </MenubarItem>
                <MenubarItem>
                  Redo <MenubarShortcut>⇧⌘Z</MenubarShortcut>
                </MenubarItem>
              </MenubarContent>
            </MenubarMenu>
          </Menubar>
        </Section>

        <Section
          id="sidebar"
          title="Sidebar"
          description="Self-contained example using SidebarProvider — pretend the outer page is the app shell."
        >
          <SidebarExample />
        </Section>

        <Section id="command" title="Command" description="cmdk-powered palette.">
          <Command className="max-w-md rounded-lg border shadow">
            <CommandInput placeholder="Type a command or search…" />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup heading="Suggestions">
                <CommandItem>
                  <CalendarIcon /> Calendar
                </CommandItem>
                <CommandItem>
                  <Star /> Add to favorites
                </CommandItem>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="Settings">
                <CommandItem>
                  Profile <CommandShortcut>⌘P</CommandShortcut>
                </CommandItem>
                <CommandItem>
                  Billing <CommandShortcut>⌘B</CommandShortcut>
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </Section>

        {/* Overlays */}
        <Section id="dialog" title="Dialog">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Open dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit capture</DialogTitle>
                <DialogDescription>Update the metadata for this capture.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div className="space-y-1">
                  <Label htmlFor="capture-name">Name</Label>
                  <Input id="capture-name" defaultValue="Owl, 2026-04-12" />
                </div>
              </div>
              <DialogFooter>
                <Button>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </Section>

        <Section id="alert-dialog" title="Alert Dialog" description="Confirm destructive actions.">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Delete capture</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this capture?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. The capture and any associated identifications will be removed.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </Section>

        <Section id="sheet" title="Sheet">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">Open sheet</Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
                <SheetDescription>Refine the captures list.</SheetDescription>
              </SheetHeader>
              <div className="space-y-3 py-4">
                <div className="space-y-1">
                  <Label htmlFor="sheet-species">Species</Label>
                  <Input id="sheet-species" placeholder="Robin, Owl…" />
                </div>
              </div>
              <SheetFooter>
                <Button>Apply</Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </Section>

        <Section id="drawer" title="Drawer">
          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="outline">Open drawer</Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Quick capture</DrawerTitle>
                <DrawerDescription>A bottom-anchored panel, great for mobile.</DrawerDescription>
              </DrawerHeader>
              <div className="px-4 py-2">
                <Input placeholder="Species name" />
              </div>
              <DrawerFooter>
                <Button>Submit</Button>
                <DrawerClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </Section>

        <Section id="popover" title="Popover">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">Settings</Button>
            </PopoverTrigger>
            <PopoverContent className="w-72">
              <div className="space-y-3">
                <p className="text-sm font-medium">Display preferences</p>
                <div className="flex items-center justify-between">
                  <Label htmlFor="pop-dark">Dark mode</Label>
                  <Switch id="pop-dark" />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="pop-compact">Compact rows</Label>
                  <Switch id="pop-compact" defaultChecked />
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </Section>

        <Section id="hover-card" title="Hover Card">
          <HoverCard>
            <HoverCardTrigger asChild>
              <Button variant="link">@maya</Button>
            </HoverCardTrigger>
            <HoverCardContent className="w-72">
              <div className="flex gap-3">
                <Avatar>
                  <AvatarImage src="https://github.com/shadcn.png" alt="Maya" />
                  <AvatarFallback>MA</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <p className="text-sm font-semibold">Maya</p>
                  <p className="text-xs text-muted-foreground">Top contributor — 1,204 points</p>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        </Section>

        <Section id="tooltip" title="Tooltip">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline">Hover me</Button>
            </TooltipTrigger>
            <TooltipContent>Tooltip content</TooltipContent>
          </Tooltip>
        </Section>

        <Section id="context-menu" title="Context Menu" description="Right-click the box.">
          <ContextMenu>
            <ContextMenuTrigger className="flex h-32 w-72 items-center justify-center rounded-md border border-dashed text-sm">
              Right click here
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem>
                Open <ContextMenuShortcut>⌘O</ContextMenuShortcut>
              </ContextMenuItem>
              <ContextMenuItem>
                Rename <ContextMenuShortcut>⌘R</ContextMenuShortcut>
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem className="text-destructive">Delete</ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        </Section>

        {/* Feedback & data */}
        <Section id="alert" title="Alert">
          <div className="space-y-3">
            <Alert>
              <Bell />
              <AlertTitle>Heads up</AlertTitle>
              <AlertDescription>You have 3 unverified captures pending review.</AlertDescription>
            </Alert>
            <Alert variant="destructive">
              <AlertTitle>Sync failed</AlertTitle>
              <AlertDescription>Could not reach the API — retrying in 30s.</AlertDescription>
            </Alert>
          </div>
        </Section>

        <Section id="badge" title="Badge">
          <div className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
          </div>
        </Section>

        <Section id="progress" title="Progress">
          <ProgressExample />
        </Section>

        <Section id="sonner" title="Sonner Toast" description="Triggers the existing Toaster mounted in App.tsx.">
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => toast('Capture saved', { description: 'Robin observed at 14:23' })}>
              Show toast
            </Button>
            <Button variant="destructive" onClick={() => toast.error('Could not save')}>
              Error toast
            </Button>
            <Button variant="outline" onClick={() => toast.success('Identification verified')}>
              Success toast
            </Button>
          </div>
        </Section>

        <Section id="avatar" title="Avatar">
          <div className="flex gap-3">
            <Avatar>
              <AvatarImage src="https://github.com/shadcn.png" alt="Avatar" />
              <AvatarFallback>SH</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarFallback>JW</AvatarFallback>
            </Avatar>
          </div>
        </Section>

        <Section id="table" title="Table">
          <Table className="max-w-2xl">
            <TableCaption>A list of recent captures.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Species</TableHead>
                <TableHead>Observer</TableHead>
                <TableHead className="text-right">Points</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                { species: 'American Robin', observer: 'maya', points: 12 },
                { species: 'Black-capped Chickadee', observer: 'theo', points: 8 },
                { species: 'Mourning Dove', observer: 'sam', points: 5 }
              ].map(row => (
                <TableRow key={row.species}>
                  <TableCell className="font-medium">{row.species}</TableCell>
                  <TableCell>{row.observer}</TableCell>
                  <TableCell className="text-right">{row.points}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Section>

        <Section id="carousel" title="Carousel">
          <Carousel className="w-full max-w-md">
            <CarouselContent>
              {Array.from({ length: 5 }, (_, i) => (
                <CarouselItem key={i}>
                  <div className="flex h-40 items-center justify-center rounded-md border bg-secondary text-2xl font-bold">
                    Slide {i + 1}
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </Section>

        <Section id="chart" title="Chart" description="Recharts wrapped with shadcn ChartContainer + tooltip + legend.">
          <ChartExample />
        </Section>
      </div>
    </div>
  </TooltipProvider>
);
