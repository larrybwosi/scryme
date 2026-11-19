export interface TaskFormValues {
  title: string;
  projectId: string;
  startDate?: string;
  dueDate?: string;
  estimatedHours: string;
  allocatedHours?: number[];
}

export type TaskFormErrors = Record<string, string>;

export function isHalfHourStep(value: number) {
  return (
    Number.isFinite(value) &&
    value > 0 &&
    Math.abs(value * 2 - Math.round(value * 2)) < 1e-9
  );
}

export function validateTaskForm(values: TaskFormValues): TaskFormErrors {
  const errors: TaskFormErrors = {};
  const title = values.title.trim();

  if (!title) {
    errors.title = "Enter a task title";
  } else if (title.length > 200) {
    errors.title = "Title must be 200 characters or fewer";
  }

  if (!values.projectId) {
    errors.projectId = "Choose a project";
  }

  if (values.startDate && values.dueDate) {
    const start = new Date(values.startDate).getTime();
    const due = new Date(values.dueDate).getTime();
    if (Number.isFinite(start) && Number.isFinite(due) && due < start) {
      errors.dueDate = "Due date must be on or after the start date";
    }
  }

  const estimated = Number.parseFloat(values.estimatedHours);
  if (!isHalfHourStep(estimated)) {
    errors.estimatedHours = "Enter positive hours in half hour steps";
  }

  values.allocatedHours?.forEach((hours, index) => {
    if (hours !== undefined && !isHalfHourStep(hours)) {
      errors[`assignees.${index}.allocatedHours`] =
        "Enter positive hours in half hour steps";
    }
  });

  return errors;
}

export function hasErrors(errors: TaskFormErrors) {
  return Object.keys(errors).length > 0;
}
