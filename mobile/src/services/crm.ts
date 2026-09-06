import { supabase } from '@/src/lib/supabase';

export type OverviewAction = {
  id: number;
  actionLabel: string;
  dueDate: string;
  priority: string;
  unitNo: string;
};

export type OverviewData = {
  customerCount: number;
  unitCount: number;
  openActions: number;
  overdueInstallments: number;
  actions: OverviewAction[];
};

export type CustomerListItem = {
  id: number;
  customer_name: string;
  email: string | null;
  phone: string | null;
  nationality: string | null;
  units: Array<{
    id: number;
    unit_no: string;
    unit_type: string | null;
    status: string | null;
    total_price: number | null;
  }>;
};

export type CustomerDetail = {
  customer: {
    id: number;
    customer_name: string;
    email: string | null;
    phone: string | null;
    nationality: string | null;
    address: string | null;
    co_applicant: string | null;
  };
  units: Array<{
    id: number;
    unit_no: string;
    project_name: string | null;
    unit_type: string | null;
    floor: string | null;
    status: string | null;
    total_price: number | null;
  }>;
  sales: Array<{
    id: number;
    unit_id: number | null;
    booking_date: string | null;
    spa_status: string | null;
    oqood_status: string | null;
    dld_status: string | null;
  }>;
  schedule: Array<{
    id: number;
    unit_id: number | null;
    stage_name: string;
    due_amount: number | null;
    paid_amount: number | null;
    due_date: string | null;
    revised_due_date: string | null;
    status: string | null;
  }>;
};

function effectiveDueDate(row: { due_date: string | null; revised_due_date: string | null }) {
  return row.revised_due_date || row.due_date;
}

export async function getOverview(): Promise<OverviewData> {
  const today = new Date().toISOString().slice(0, 10);
  const [customers, units, actionsCount, schedule, actions] = await Promise.all([
    supabase.from('customers').select('id', { count: 'exact', head: true }),
    supabase.from('units').select('id', { count: 'exact', head: true }),
    supabase.from('scheduled_actions').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('payment_schedule').select('id,due_date,revised_due_date,due_amount,paid_amount,status'),
    supabase
      .from('scheduled_actions')
      .select('id,action_label,due_date,priority,unit_id,units(unit_no)')
      .eq('status', 'pending')
      .order('due_date', { ascending: true })
      .limit(8),
  ]);

  for (const result of [customers, units, actionsCount, schedule, actions]) {
    if (result.error) throw result.error;
  }

  const overdueInstallments = (schedule.data ?? []).filter((row) => {
    const dueDate = effectiveDueDate(row);
    const remaining = Number(row.due_amount || 0) - Number(row.paid_amount || 0);
    return Boolean(dueDate && dueDate < today && remaining > 0 && String(row.status || '').toLowerCase() !== 'paid');
  }).length;

  const mappedActions: OverviewAction[] = (actions.data ?? []).map((row: any) => ({
    id: row.id,
    actionLabel: row.action_label,
    dueDate: row.due_date,
    priority: row.priority,
    unitNo: row.units?.unit_no || `Unit ${row.unit_id}`,
  }));

  return {
    customerCount: customers.count ?? 0,
    unitCount: units.count ?? 0,
    openActions: actionsCount.count ?? 0,
    overdueInstallments,
    actions: mappedActions,
  };
}

export async function getCustomers(search = ''): Promise<CustomerListItem[]> {
  const { data, error } = await supabase
    .from('customers')
    .select('id,customer_name,email,phone,nationality,units(id,unit_no,unit_type,status,total_price)')
    .order('customer_name', { ascending: true })
    .limit(500);

  if (error) throw error;
  const rows = (data ?? []) as unknown as CustomerListItem[];
  const q = search.trim().toLowerCase();
  if (!q) return rows;

  return rows.filter((row) => {
    const customerMatch = [row.customer_name, row.email, row.phone, row.nationality]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(q));
    const unitMatch = row.units?.some((unit) => unit.unit_no.toLowerCase().includes(q));
    return customerMatch || unitMatch;
  });
}

export async function getCustomerDetail(customerId: number): Promise<CustomerDetail> {
  const [customer, units, sales, schedule] = await Promise.all([
    supabase
      .from('customers')
      .select('id,customer_name,email,phone,nationality,address,co_applicant')
      .eq('id', customerId)
      .single(),
    supabase
      .from('units')
      .select('id,unit_no,project_name,unit_type,floor,status,total_price')
      .eq('customer_id', customerId)
      .order('unit_no'),
    supabase
      .from('sales')
      .select('id,unit_id,booking_date,spa_status,oqood_status,dld_status')
      .eq('customer_id', customerId),
    supabase
      .from('payment_schedule')
      .select('id,unit_id,stage_name,due_amount,paid_amount,due_date,revised_due_date,status')
      .eq('customer_id', customerId)
      .order('due_date', { ascending: true }),
  ]);

  for (const result of [customer, units, sales, schedule]) {
    if (result.error) throw result.error;
  }

  return {
    customer: customer.data as CustomerDetail['customer'],
    units: (units.data ?? []) as CustomerDetail['units'],
    sales: (sales.data ?? []) as CustomerDetail['sales'],
    schedule: (schedule.data ?? []) as CustomerDetail['schedule'],
  };
}
