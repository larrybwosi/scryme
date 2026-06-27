"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { Textarea } from "@repo/ui/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
// Import Sheet components
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@repo/ui/components/ui/sheet";
import { Template } from "@/types/bakery";
import {
  Trash2,
  Clock,
  FileText,
  BookOpen,
  Layers,
  Shield,
  Loader2,
  ChefHat,
  Users,
  Check,
} from "lucide-react";
// import { AdvancedUnitSelector } from '@/components/bakery/common/units/advance-select';
import { Switch } from "@repo/ui/components/ui/switch";
import { Checkbox } from "@repo/ui/components/ui/checkbox";
import {
  TemplateFormData,
  templateSchema,
  updateTemplateSchema,
} from "@/validations/bakery";
import {
  useCreateTemplate,
  useRecipes,
  useUpdateTemplate,
  useBakers,
} from "@/hooks/bakery";
import { Badge } from "@repo/ui/components/ui/badge";
import { useDeleteConfirmation } from "@/lib/providers/delete-modal";
import { AdvancedUnitSelector } from "@/components/common/units/advance-select";

interface CreateEditTemplateProps {
  template?: Template | null;
  initialData?: Partial<TemplateFormData>; // New prop for pre-filling
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete?: (templateId: string) => void;
}

const DAYS_OF_WEEK = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
] as const;

export function CreateEditTemplate({
  template,
  initialData,
  isOpen,
  onOpenChange,
  onDelete,
}: CreateEditTemplateProps) {
  const { mutateAsync: createTemplate, isPending: creatingTemplate } =
    useCreateTemplate();
  const { mutateAsync: updateTemplate, isPending: updatingTemplate } =
    useUpdateTemplate();
  const { confirmDelete } = useDeleteConfirmation();
  const {
    data: recipes = [],
    isLoading: isLoadingRecipes,
    error: recipesError,
  } = useRecipes();
  const {
    data: bakers = [],
    isLoading: isLoadingBakers,
    error: bakersError,
  } = useBakers();
  const isEditing = !!template;

  // Use the appropriate schema based on whether we're editing or creating
  const currentSchema = isEditing ? updateTemplateSchema : templateSchema;

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(currentSchema),
    defaultValues: {
      name: template?.name ?? initialData?.name ?? "",
      recipeId: template?.recipeId ?? initialData?.recipeId ?? "",
      quantity: template?.quantity ?? initialData?.quantity ?? 1,
      systemUnitId:
        template?.systemUnitId ?? initialData?.systemUnitId ?? undefined,
      orgUnitId: template?.orgUnitId ?? initialData?.orgUnitId ?? undefined,
      recipeMultiplier:
        template?.recipeMultiplier ?? initialData?.recipeMultiplier ?? 1.0,
      duration: template?.duration ?? initialData?.duration ?? undefined,
      leadBakerId:
        template?.leadBakerId ?? initialData?.leadBakerId ?? undefined,
      assistantBakerIds:
        (template as any)?.assistantBakers?.map((ab: any) => ab.id) ??
        initialData?.assistantBakerIds ??
        [],
      notes: template?.notes ?? initialData?.notes ?? "",
      isActive: template?.isActive ?? initialData?.isActive ?? true,
      scheduleTime: template?.scheduleTime ?? initialData?.scheduleTime ?? "",
      scheduleDays: template?.scheduleDays ?? initialData?.scheduleDays ?? [],
      shelfLifeDays:
        template?.shelfLifeDays ?? initialData?.shelfLifeDays ?? undefined,
    },
  });

  const isLoading = isLoadingRecipes || isLoadingBakers;
  const error = recipesError || bakersError;

  const watchedSystemUnitId = useWatch({ control, name: "systemUnitId" });
  const watchedOrgUnitId = useWatch({ control, name: "orgUnitId" });
  const unitValue = watchedSystemUnitId || watchedOrgUnitId;
  const unitErrorMessage =
    !watchedSystemUnitId && !watchedOrgUnitId && errors.root?.message
      ? errors.root.message
      : errors.systemUnitId?.message || errors.orgUnitId?.message || undefined;

  const handleUnitChange = (
    value: string | undefined,
    type: "system" | "org",
  ) => {
    const options = { shouldDirty: true, shouldValidate: true };
    // Clear the other unit field to ensure only one is set
    setValue("systemUnitId", type === "system" ? value : undefined, options);
    setValue("orgUnitId", type === "org" ? value : undefined, options);
  };

  const handleFormSubmit = async (data: TemplateFormData) => {
    try {
      const finalLeadBakerId =
        data.leadBakerId === "none_clear" ? null : data.leadBakerId;
      const submissionData = {
        ...data,
        leadBakerId: finalLeadBakerId,
      };

      if (isEditing && template) {
        // Explicitly set the correct unit ID based on which one is present/selected
        const payload = {
          ...submissionData,
          unitId: data.orgUnitId || data.systemUnitId,
          systemUnitId: undefined, // ensure systemUnitId is not passed if it's not the final ID
          orgUnitId: undefined, // remove from payload
        };
        await updateTemplate({ templateId: template.id, data: payload as any });
      } else {
        await createTemplate(submissionData);
        // Clear the form after a successful creation
        if (!isEditing) {
          reset();
        }
      }
      onOpenChange(false);
    } catch (error) {
      console.error(
        `Failed to ${isEditing ? "update" : "create"} template:`,
        error,
      );
    }
  };

  const handleDelete = async () => {
    if (!template || !onDelete) return;

    const confirmed = await confirmDelete({
      entityType: "template",
      entityName: template.name,
      title: "Delete Template",
      description: `Are you sure you want to delete the template "${template.name}"? This action cannot be undone.`,
    });

    if (confirmed) {
      onDelete(template.id);
      onOpenChange(false);
    }
  };

  const handleSheetOpenChange = (open: boolean) => {
    // Reset form state to original template values when closing in edit mode
    // Also reset if opening new with different initialData (though usually handled by key or separate effect)
    if (open) {
      reset({
        name: template?.name ?? initialData?.name ?? "",
        recipeId: template?.recipeId ?? initialData?.recipeId ?? "",
        quantity: template?.quantity ?? initialData?.quantity ?? 1,
        systemUnitId:
          template?.systemUnitId ?? initialData?.systemUnitId ?? undefined,
        orgUnitId: template?.orgUnitId ?? initialData?.orgUnitId ?? undefined,
        recipeMultiplier:
          template?.recipeMultiplier ?? initialData?.recipeMultiplier ?? 1.0,
        duration: template?.duration ?? initialData?.duration ?? undefined,
        leadBakerId:
          template?.leadBakerId ?? initialData?.leadBakerId ?? undefined,
        assistantBakerIds:
          (template as any)?.assistantBakers?.map((ab: any) => ab.id) ??
          initialData?.assistantBakerIds ??
          [],
        notes: template?.notes ?? initialData?.notes ?? "",
        isActive: template?.isActive ?? initialData?.isActive ?? true,
        scheduleTime: template?.scheduleTime ?? initialData?.scheduleTime ?? "",
        scheduleDays: template?.scheduleDays ?? initialData?.scheduleDays ?? [],
        shelfLifeDays:
          template?.shelfLifeDays ?? initialData?.shelfLifeDays ?? undefined,
      });
    }

    if (!open && isEditing) {
      reset({
        name: template?.name || "",
        recipeId: template?.recipeId || "",
        quantity: template?.quantity || 1,
        systemUnitId: template?.systemUnitId || undefined,
        orgUnitId: template?.orgUnitId || undefined,
        recipeMultiplier: template?.recipeMultiplier || 1.0,
        duration: template?.duration || undefined,
        leadBakerId: template?.leadBakerId || undefined,
        assistantBakerIds:
          (template as any)?.assistantBakers?.map((ab: any) => ab.id) || [],
        notes: template?.notes || "",
        isActive: template?.isActive ?? true,
        scheduleTime: template?.scheduleTime || "",
        scheduleDays: template?.scheduleDays || [],
        shelfLifeDays: template?.shelfLifeDays || undefined,
      });
    }
    onOpenChange(open);
  };

  const toggleScheduleDay = (dayValue: number) => {
    const currentDays = scheduleDays;
    const dayIndex = currentDays.indexOf(dayValue);

    let newDays;
    if (dayIndex > -1) {
      newDays = currentDays.filter((d) => d !== dayValue);
    } else {
      newDays = [...currentDays, dayValue];
    }

    // Sort days for consistency (Sun=0 to Sat=6)
    newDays.sort((a, b) => Number(a) - Number(b));
    setValue("scheduleDays", newDays, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const scheduleDays = useWatch({ control, name: "scheduleDays" }) || [];
  const assistantBakerIds =
    useWatch({ control, name: "assistantBakerIds" }) || [];
  const leadBakerId = useWatch({ control, name: "leadBakerId" });
  const recipeId = useWatch({ control, name: "recipeId" });
  const isActive = useWatch({ control, name: "isActive" });

  const isDaySelected = (dayValue: number) => {
    return scheduleDays.includes(dayValue);
  };

  const isMutationPending = creatingTemplate || updatingTemplate;
  const isFormSubmitting = isSubmitting || isMutationPending;

  const selectedDaysCount = scheduleDays.length;

  return (
    <Sheet open={isOpen} onOpenChange={handleSheetOpenChange}>
      <SheetContent
        side="right"
        // FIX: Use h-full and flex-col, remove overflow-y-auto from here, use p-0 for container control
        className="w-full sm:max-w-xl h-full p-0 flex flex-col"
      >
        {/* FIX: Add padding back to the Header since SheetContent has p-0 */}
        <SheetHeader className="pb-4 pt-6 px-6 border-b">
          <SheetTitle className="text-2xl font-bold flex items-center gap-3 text-foreground">
            <Layers className="h-6 w-6 text-muted-foreground" />
            {isEditing ? "Edit Template" : "Create New Template"}
          </SheetTitle>
          <SheetDescription className="text-base text-muted-foreground">
            {isEditing
              ? "Update the reusable details for this product."
              : "Define a reusable production template from an existing recipe."}
          </SheetDescription>
        </SheetHeader>
        <form
          id="template-form"
          onSubmit={handleSubmit((data) => handleFormSubmit(data as any))}
          className="flex-1 space-y-8 overflow-y-auto py-4 px-6"
        >
          {/* Template Basics Section */}
          <div className="space-y-6">
            <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Template Basics
            </h3>

            {/* Template Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Template Name{" "}
                {isEditing ? "" : <span className="text-destructive">*</span>}
              </Label>
              <Input
                id="name"
                placeholder="e.g., Daily Bread Batch, Weekend Pastries"
                {...register("name")}
                className={
                  errors.name
                    ? "border-destructive focus-visible:ring-destructive"
                    : ""
                }
                disabled={isFormSubmitting}
              />
              {errors.name && (
                <p className="text-destructive text-sm mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Base Recipe */}
            <div className="space-y-2">
              <Label htmlFor="recipeId" className="text-sm font-medium">
                Base Recipe{" "}
                {isEditing ? "" : <span className="text-destructive">*</span>}
              </Label>
              <Select
                value={recipeId}
                onValueChange={(value) =>
                  setValue("recipeId", value, { shouldValidate: true })
                }
                disabled={isLoading || isFormSubmitting}
              >
                <SelectTrigger
                  className={
                    errors.recipeId
                      ? "border-destructive focus-visible:ring-destructive"
                      : ""
                  }
                >
                  <SelectValue
                    placeholder={
                      isLoading ? "Loading recipes..." : "Select a base recipe"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {isLoading ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                      Loading...
                    </div>
                  ) : error ? (
                    <div className="px-2 py-1.5 text-sm text-destructive">
                      Failed to load recipes
                    </div>
                  ) : (
                    recipes.map((recipe) => (
                      <SelectItem key={recipe.id} value={recipe.id}>
                        {recipe.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.recipeId && (
                <p className="text-destructive text-sm mt-1">
                  {errors.recipeId.message}
                </p>
              )}
            </div>

            {/* Quantity and Unit Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Quantity */}
              <div className="space-y-2">
                <Label htmlFor="quantity" className="text-sm font-medium">
                  Default Quantity{" "}
                  {isEditing ? "" : <span className="text-destructive">*</span>}
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="1"
                  {...register("quantity", { valueAsNumber: true })}
                  className={
                    errors.quantity
                      ? "border-destructive focus-visible:ring-destructive"
                      : ""
                  }
                  disabled={isFormSubmitting}
                />
                {errors.quantity && (
                  <p className="text-destructive text-sm mt-1">
                    {errors.quantity.message}
                  </p>
                )}
              </div>

              {/* Unit */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Unit{" "}
                  {isEditing ? "" : <span className="text-destructive">*</span>}
                </Label>
                <AdvancedUnitSelector
                  value={unitValue || undefined}
                  onValueChange={handleUnitChange}
                  disabled={isFormSubmitting}
                  placeholder="Select Unit"
                  className={
                    unitErrorMessage
                      ? "border-destructive focus-visible:ring-destructive"
                      : ""
                  }
                />
                {unitErrorMessage && (
                  <p className="text-destructive text-sm mt-1">
                    {unitErrorMessage}
                  </p>
                )}
              </div>
            </div>

            {/* Recipe Multiplier */}
            <div className="space-y-2">
              <Label htmlFor="recipeMultiplier" className="text-sm font-medium">
                Recipe Multiplier
              </Label>
              <Input
                id="recipeMultiplier"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="1.0"
                {...register("recipeMultiplier", { valueAsNumber: true })}
                className={
                  errors.recipeMultiplier
                    ? "border-destructive focus-visible:ring-destructive"
                    : ""
                }
                disabled={isFormSubmitting}
              />
              {errors.recipeMultiplier && (
                <p className="text-destructive text-sm mt-1">
                  {errors.recipeMultiplier.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Scale the recipe ingredients (e.g., 2.0 for double, 0.5 for half
                batch)
              </p>
            </div>
          </div>

          <hr className="my-8" />

          {/* Schedule Section */}
          <div className="space-y-6">
            <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              Schedule Settings{" "}
              <Badge variant="outline" className="text-xs font-normal ml-2">
                Optional
              </Badge>
            </h3>

            {/* Schedule Time */}
            <div className="space-y-2">
              <Label htmlFor="scheduleTime" className="text-sm font-medium">
                Scheduled Time
              </Label>
              <div className="relative max-w-xs w-full">
                <Input
                  id="scheduleTime"
                  type="time"
                  placeholder="HH:MM"
                  {...register("scheduleTime")}
                  className={
                    errors.scheduleTime
                      ? "border-destructive focus-visible:ring-destructive"
                      : ""
                  }
                  disabled={isFormSubmitting}
                />
              </div>
              {errors.scheduleTime && (
                <p className="text-destructive text-sm mt-1">
                  {errors.scheduleTime.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Time when this template should be scheduled (e.g., 08:00)
              </p>
            </div>

            {/* Schedule Days */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="scheduleDays" className="text-sm font-medium">
                  Recurring Days
                </Label>
                {selectedDaysCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {selectedDaysCount} day{selectedDaysCount !== 1 ? "s" : ""}{" "}
                    selected
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleScheduleDay(day.value)}
                    disabled={isFormSubmitting}
                    className={`
                      flex flex-col items-center justify-center p-1 sm:p-2 rounded-lg text-xs font-medium transition-colors
                      ${
                        isDaySelected(day.value)
                          ? "bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
                          : "bg-muted text-muted-foreground hover:bg-muted/80 border border-input"
                      }
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
              {errors.scheduleDays && (
                <p className="text-destructive text-sm mt-1">
                  {errors.scheduleDays.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Select days for recurring schedules (leave empty for one-time
                production)
              </p>
            </div>
          </div>

          <hr className="my-8" />

          {/* Personnel Section */}
          <div className="space-y-6">
            <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
              <ChefHat className="h-5 w-5 text-muted-foreground" />
              Personnel{" "}
              <Badge variant="outline" className="text-xs font-normal ml-2">
                Optional
              </Badge>
            </h3>

            {/* Lead Baker */}
            <div className="space-y-2">
              <Label htmlFor="leadBakerId" className="text-sm font-medium">
                Default Lead Baker
              </Label>
              <Select
                value={leadBakerId || ""}
                onValueChange={(value) => {
                  setValue("leadBakerId", value || undefined, {
                    shouldDirty: true,
                  });
                  // Remove from assistants if selected as lead
                  const currentAssistants = assistantBakerIds;
                  if (value && currentAssistants.includes(value)) {
                    setValue(
                      "assistantBakerIds",
                      currentAssistants.filter((id) => id !== value),
                      { shouldDirty: true },
                    );
                  }
                }}
                disabled={isFormSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="No default lead (uses system default)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none_clear">
                    None (System Default)
                  </SelectItem>
                  {bakers
                    .filter((b) => b.isActive)
                    .map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name || "Unknown"}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                The baker who will be assigned as Lead by default
              </p>
            </div>

            {/* Assistant Bakers */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Default Assistant Bakers
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 border rounded-lg bg-muted/20 max-h-40 overflow-y-auto">
                {bakers
                  .filter((b) => b.isActive && b.id !== leadBakerId)
                  .map((baker) => {
                    const isSelected = assistantBakerIds?.includes(baker.id);
                    return (
                      <div
                        key={baker.id}
                        className={`
                        flex items-center gap-2 p-2 rounded-md transition-colors cursor-pointer
                        ${isSelected ? "bg-primary/10 border-primary/20" : "hover:bg-accent"}
                      `}
                        onClick={() => {
                          const current = assistantBakerIds;
                          if (isSelected) {
                            setValue(
                              "assistantBakerIds",
                              current.filter((id) => id !== baker.id),
                              { shouldDirty: true },
                            );
                          } else {
                            setValue(
                              "assistantBakerIds",
                              [...current, baker.id],
                              { shouldDirty: true },
                            );
                          }
                        }}
                      >
                        <div
                          className={`
                        w-4 h-4 rounded border flex items-center justify-center transition-colors
                        ${isSelected ? "bg-primary border-primary" : "border-input bg-background"}
                      `}
                        >
                          {isSelected && (
                            <Check className="h-3 w-3 text-primary-foreground" />
                          )}
                        </div>
                        <span className="text-sm truncate">{baker.name}</span>
                      </div>
                    );
                  })}
                {bakers.filter((b) => b.isActive && b.id !== leadBakerId)
                  .length === 0 && (
                  <p className="text-xs text-muted-foreground italic col-span-2">
                    No other active bakers available.
                  </p>
                )}
              </div>
            </div>
          </div>

          <hr className="my-8" />
          <div className="space-y-6">
            <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-600" />
              Production Details
            </h3>

            {/* Duration and Shelf Life Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Duration */}
              <div className="space-y-2">
                <Label htmlFor="duration" className="text-sm font-medium">
                  Expected Duration (minutes)
                </Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  placeholder="e.g., 240 (4 hours)"
                  {...register("duration", { valueAsNumber: true })}
                  className={
                    errors.duration
                      ? "border-destructive focus-visible:ring-destructive"
                      : ""
                  }
                  disabled={isFormSubmitting}
                />
                {errors.duration && (
                  <p className="text-destructive text-sm mt-1">
                    {errors.duration.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Estimated time in minutes
                </p>
              </div>

              {/* Shelf Life */}
              <div className="space-y-2">
                <Label htmlFor="shelfLifeDays" className="text-sm font-medium">
                  Shelf Life (Days)
                </Label>
                <Input
                  id="shelfLifeDays"
                  type="number"
                  min="1"
                  placeholder="e.g., 3 or 7"
                  {...register("shelfLifeDays", { valueAsNumber: true })}
                  className={
                    errors.shelfLifeDays
                      ? "border-destructive focus-visible:ring-destructive"
                      : ""
                  }
                  disabled={isFormSubmitting}
                />
                {errors.shelfLifeDays && (
                  <p className="text-destructive text-sm mt-1">
                    {errors.shelfLifeDays.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Days the product remains fresh
                </p>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-medium">
                Additional Notes
              </Label>
              <Textarea
                id="notes"
                placeholder="Special instructions, quality checks, or important reminders..."
                rows={4}
                {...register("notes")}
                disabled={isFormSubmitting}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Any special considerations for production
              </p>
            </div>
          </div>

          <hr className="my-8" />

          {/* Template Status */}
          <div className="flex items-center justify-between p-4 border rounded-xl bg-muted/20 shadow-inner">
            <div className="space-y-1">
              <Label
                htmlFor="isActive"
                className="text-base font-semibold flex items-center gap-2"
              >
                <Shield className="h-5 w-5 text-blue-500" /> Template Status
              </Label>
              <p className="text-sm text-muted-foreground">
                {isActive
                  ? "Active templates can be used in production."
                  : "Inactive templates are archived and cannot be used."}
              </p>
            </div>
            <Switch
              id="isActive"
              checked={isActive}
              onCheckedChange={(checked) =>
                setValue("isActive", checked, { shouldDirty: true })
              }
              disabled={isFormSubmitting}
              className="data-[state=checked]:bg-primary"
            />
          </div>
        </form>

        {/* FIX: SheetFooter is outside the form and positioned at the bottom by the flex-col layout. */}
        <SheetFooter className="bg-background p-4 px-6 border-t flex flex-col-reverse sm:flex-row sm:justify-between gap-3">
          <div className="flex justify-center sm:justify-start w-full sm:w-auto">
            {isEditing && onDelete && (
              <Button
                type="button"
                variant="outline"
                size="default"
                onClick={handleDelete}
                disabled={isFormSubmitting}
                className="text-destructive border-destructive/20 hover:bg-destructive/10 hover:text-destructive w-full sm:w-auto"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Template
              </Button>
            )}
          </div>

          <div className="flex gap-3 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSheetOpenChange(false)}
              disabled={isFormSubmitting}
              className="w-1/2 sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="template-form" // Link button to the form element using its ID
              disabled={isFormSubmitting}
              className="w-1/2 sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isFormSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {isEditing ? "Saving..." : "Creating..."}
                </>
              ) : isEditing ? (
                "Save Changes"
              ) : (
                "Create Template"
              )}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
