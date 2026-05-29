// types/printer.ts
export interface Printer {
  Name: string;
  DriverName: string;
  JobCount: number;
  PrintProcessor: string;
  PortName: string;
  ShareName: string | null;
  ComputerName: string;
  PrinterStatus: number;
  Shared: boolean;
  Type: number;
  Priority: number;
}
