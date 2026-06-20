export class EmployeeProfileDTO {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly phone: string,
    public readonly role: string
  ) {}

  static fromEntity(employee: any): EmployeeProfileDTO {
    return new EmployeeProfileDTO(
      employee.id,
      employee.name,
      employee.phone,
      employee.role
    );
  }
}
