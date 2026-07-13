export interface TripInput {
  tripDate: string
  truckPlateNumber: string
  driverName: string
  helperName: string
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
  remarks: string
}

export interface Trip extends TripInput {
  id: string
  createdAt: string
  updatedAt: string
}

export type TripFormErrors = Partial<Record<keyof TripInput, string>>

export type ModalMode = 'create' | 'edit' | 'duplicate'
