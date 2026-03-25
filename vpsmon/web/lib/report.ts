export interface ReportOptions {
  sections: string[];
  companyName?: string;
}

export async function generateSummaryReport(data: unknown, options: ReportOptions): Promise<Uint8Array> {
  const content = `VPSMon Report\nCompany: ${options.companyName ?? "N/A"}\nSections: ${options.sections.join(",")}\nData: ${JSON.stringify(data).slice(0, 2000)}`;
  return new TextEncoder().encode(content);
}
