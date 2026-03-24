export interface ReportOptions {
  sections: string[];
  companyName?: string;
}

export async function generateSummaryReport(data: unknown, options: ReportOptions): Promise<Buffer> {
  const content = `VPSMon Report\nCompany: ${options.companyName ?? "N/A"}\nSections: ${options.sections.join(",")}\nData: ${JSON.stringify(data).slice(0, 2000)}`;
  return Buffer.from(content, "utf8");
}
