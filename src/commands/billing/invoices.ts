import { output } from '../../cli';
import type { SdkGuardedFunction } from '../../guards/types';
import { withGuards } from '../../guards/withGuards';

type InvoicesOptions = {
  status?: string;
  limit: number;
};

const invoicesAction: SdkGuardedFunction<InvoicesOptions> = async ({ sdk }, options) => {
  const invoices = await sdk.billing().listInvoices({
    status: options.status,
    limit: options.limit,
  });

  if (!invoices || invoices.length === 0) {
    output.warn('No invoices found');
    return;
  }

  output.printNewLine();
  output.log(`Invoices (showing ${invoices.length}):`);
  output.printNewLine();

  const tableData = invoices.map((invoice) => ({
    'Invoice #': invoice.invoiceNumber,
    Status: invoice.status,
    Total: `$${(invoice.total / 100).toFixed(2)}`,
    'Amount Due': `$${(invoice.amountDue / 100).toFixed(2)}`,
    'Due Date': invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A',
    'Paid At': invoice.paidAt ? new Date(invoice.paidAt).toLocaleDateString() : 'N/A',
    Period: `${new Date(invoice.periodStart).toLocaleDateString()} - ${new Date(invoice.periodEnd).toLocaleDateString()}`,
    PDF: invoice.pdfUrl || 'N/A',
  }));

  output.table(tableData);
};

export const invoicesActionHandler = withGuards(invoicesAction, {
  scopes: {
    authenticated: true,
    project: false,
    site: false,
  },
});
