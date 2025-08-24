export interface HotelDTO{
  id: number
  name: string
  description: string
  location: string
  imageUrl: string
  rating: string
  adminId: string
  rooms: Room[]
}

export interface Rooms {
    pageIndex: number
    pageSize: number
    count: number
    data: Room[]
}

export interface Room {
    id: number
    price: number
    isAvailable: boolean
    roomType: string
    description: string
    from: string
    to: string
    hotelCompanyId: number
    hotelCompanyName: string
    roomImages: RoomImage[]
}

export interface RoomImage {
    id: number
    imageUrl: string
    roomId: number
}

export interface HotelDashboardStats {
  totalRooms: number;
  totalBookings: number;
  activeBookings: number;
  totalRevenue: number;
  bookingChart: {
    date: string;
    count: number;
  }[];
}
