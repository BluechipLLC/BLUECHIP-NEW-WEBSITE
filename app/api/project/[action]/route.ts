import { createInquiryApi } from '@/lib/inquiry/api';

// Inquiries write to disk and call Cal.com and Resend, so this always runs per request on Node.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

let handle: ReturnType<typeof createInquiryApi> | undefined;

export async function POST(request: Request, { params }: RouteContext<'/api/project/[action]'>) {
  const { action } = await params;
  handle ??= createInquiryApi();
  return handle(action, request);
}
