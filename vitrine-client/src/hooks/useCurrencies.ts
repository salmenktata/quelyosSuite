import { useQuery } from '@tanstack/react-query';

export interface Currency {
  id: number;
  name: string;
  symbol: string;
  full_name: string;
  active: boolean;
  decimal_places: number;
  rounding: number;
  position: 'before' | 'after';
}

async function fetchCurrencies(activeOnly: boolean = true): Promise<Currency[]> {
  const response = await fetch('/api/ecommerce/currencies', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'call',
      params: { active_only: activeOnly },
      id: 1,
    }),
  });

  const json = await response.json();

  if (!json.result || !json.result.success) {
    throw new Error(json.result?.error || 'Failed to fetch currencies');
  }

  return json.result.data;
}

export function useCurrencies(activeOnly: boolean = true) {
  return useQuery({
    queryKey: ['currencies', activeOnly],
    queryFn: () => fetchCurrencies(activeOnly),
  });
}

interface ConvertCurrencyParams {
  amount: number;
  from_currency: string;
  to_currency: string;
  date?: string;
}

interface ConvertedAmount {
  amount: number;
  from_currency: string;
  to_currency: string;
  converted_amount: number;
  from_rate: number;
  to_rate: number;
  date: string;
}

export async function convertCurrency(params: ConvertCurrencyParams): Promise<ConvertedAmount> {
  const response = await fetch('/api/ecommerce/currencies/convert', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'call',
      params,
      id: 1,
    }),
  });

  const json = await response.json();

  if (!json.result || !json.result.success) {
    throw new Error(json.result?.error || 'Failed to convert currency');
  }

  return json.result.data;
}
