interface User {
  id: string;
  firstName: string;
  lastName: string;
  userName: string;
  email: string;
  phoneNumber: string;
  address: string;
  roles: string[];
    managedCompanies?: Array<{
    role: string;
    companyName: string;
    companyId: number;
    companyType: string;
  }>;
}

interface UsersResponse {
  data: User[];
  totalCount: number;
}