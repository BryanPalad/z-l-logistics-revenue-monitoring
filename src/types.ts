export interface SubTripInput {
  id: string
  destinationProvinceCode: string
  destinationProvince: string
  destinationCityCode: string
  destinationCity: string
  destinationBarangayCode: string
  destinationBarangay: string
  destinationAddress: string
  customerRate: number
}

export interface TripInput {
  tripDate: string
  truckPlateNumber: string
  driverName: string
  helperName: string
  originProvinceCode: string
  originProvince: string
  originCityCode: string
  originCity: string
  originBarangayCode: string
  originBarangay: string
  originAddress: string
  destinationProvinceCode: string
  destinationProvince: string
  destinationCityCode: string
  destinationCity: string
  destinationBarangayCode: string
  destinationBarangay: string
  destinationAddress: string
  destination: string
  customerName: string
  revenue: number
  driverRate: number
  helperRate: number
  gasExpense: number
  parkingExpense: number
  tollExpense: number
  foodExpense: number
  otherExpense: number
  subTrips: SubTripInput[]
  remarks: string
}

export interface Trip extends TripInput {
  id: string
  routeDistanceMeters: number | null
  routeDurationSeconds: number | null
  routeCalculatedAt: string
  createdAt: string
  updatedAt: string
}

export type TripFormErrors = Partial<Record<keyof TripInput, string>>

export type ModalMode = 'create' | 'edit' | 'duplicate'
