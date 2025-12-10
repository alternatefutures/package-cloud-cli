import { output } from '../../cli';
import type { SdkGuardedFunction } from '../../guards/types';
import { withGuards } from '../../guards/withGuards';
import { getBillingClient } from './utils/getBillingClient';

type InvoicesOptions = {
  status?: string;
  limit?: string;
};

const invoicesAction: SdkGuardedFunction<InvoicesOptions> = async ({
  sdk,
  args,
}) => {
  const billingClient = getBillingClient(sdk);
  if (!billingClient) return;

  const invoices = await billingClient.listInvoices({
    status: args.status,
    limit: args.limit ? Number(args.limit) : 50,
  });

  if (!invoices || invoices.length === 0) {
    output.warn('No invoices found');
    return;
  }

  output.printNewLine();
  output.log(`Invoices (showing ${invoices.length}):`);
  output.printNewLine();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tableData = invoices.map((invoice: any) => ({
    'Invoice #': invoice.invoiceNumber,
    Status: invoice.status,
    Total: `$${(invoice.total / 100).toFixed(2)}`,
    'Amount Due': `$${(invoice.amountDue / 100).toFixed(2)}`,
    'Due Date': invoice.dueDate
      ? new Date(invoice.dueDate * 1000).toLocaleDateString()
      : 'N/A',
    'Paid At': invoice.paidAt
      ? new Date(invoice.paidAt * 1000).toLocaleDateString()
      : 'N/A',
    Period: invoice.periodStart && invoice.periodEnd
      ? `${new Date(invoice.periodStart * 1000).toLocaleDateString()} - ${new Date(invoice.periodEnd * 1000).toLocaleDateString()}`
      : 'N/A',
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
