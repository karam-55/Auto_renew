export interface IEmployeeRepository {
  findByPhone(phone: string): Promise<any | null>;
  findById(id: string): Promise<any | null>;
  save(employee: any): Promise<any>;
  update(employee: any): Promise<any>;
}
