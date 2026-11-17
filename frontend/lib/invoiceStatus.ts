export function getInvoiceDisplayStatus(status: string, dueDate?: string | null) {
  const normalizedStatus = status.trim().toLowerCase();
  const isOverdueEligible = ["pending", "sent", "overdue"].includes(normalizedStatus);

  if (isOverdueEligible && dueDate && Date.parse(dueDate) < Date.now()) {
    return "overdue";
  }

  return normalizedStatus;
}
