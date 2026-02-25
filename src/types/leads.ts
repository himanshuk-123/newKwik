/**
 * Lead Type Definitions
 */

export interface Lead {
  Id: number;
  LeadUId?: string;
  RegNo?: string;
  ProspectNo?: string;
  VehicleType?: number | string;
  VehicleTypeValue?: string;
  CustomerName?: string;
  CustomerMobileNo?: string;
  CompanyId?: number;
  Vehicle?: string;
  [key: string]: any;
}
