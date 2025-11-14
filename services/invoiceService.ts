import type { Invoice, Project, TimeEntry, InvoiceLineItem } from '../types';

export const generateInvoice = (
    clientId: string, 
    project: Project, 
    entries: TimeEntry[],
    manualItems: Omit<InvoiceLineItem, 'total'>[],
    invoiceNumber: string,
    taxRate: number,
    entryIds: string[]
): Invoice => {
  
  // Sorteer boekingen op datum, met de nieuwste bovenaan, voor een logische opmaak.
  const sortedEntries = [...entries].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  
  const timeBasedLineItems: InvoiceLineItem[] = sortedEntries.map(entry => {
    if (!entry.endTime || entry.accumulatedDuration <= 0) {
      return { description: entry.description, quantity: 0, price: project.rate, total: 0 };
    }
    const hours = entry.accumulatedDuration / (1000 * 60 * 60);
    const total = hours * project.rate;
    const dateStr = entry.startTime.toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return {
      description: `${dateStr} - ${entry.description}`,
      quantity: parseFloat(hours.toFixed(2)),
      price: project.rate,
      total: parseFloat(total.toFixed(2)),
    };
  });

  const manualLineItems: InvoiceLineItem[] = manualItems.map(item => ({
      ...item,
      total: item.quantity * item.price,
  }));

  const allLineItems = [...timeBasedLineItems, ...manualLineItems];

  const subtotal = allLineItems.reduce((acc, item) => acc + item.total, 0);
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  const issueDate = new Date();
  const dueDate = new Date();
  dueDate.setDate(issueDate.getDate() + 15);

  return {
    id: `inv-${Date.now()}`,
    number: invoiceNumber,
    clientId,
    projectId: project.id,
    subject: '',
    issueDate,
    dueDate,
    lineItems: allLineItems,
    subtotal: parseFloat(subtotal.toFixed(2)),
    tax: parseFloat(tax.toFixed(2)),
    taxRate,
    total: parseFloat(total.toFixed(2)),
    timeEntryIds: entryIds,
  };
};