export type Store = {
  id: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  timings: string;
  flagship?: boolean;
};

export const stores: Store[] = [
  {
    id: "st-01",
    name: "HEMMLOCK Bandra Flagship",
    city: "Mumbai",
    address: "Shop 12, Linking Road, Bandra West, Mumbai 400050",
    phone: "+91 98200 41120",
    timings: "11:00 AM – 9:30 PM, All days",
    flagship: true,
  },
  {
    id: "st-02",
    name: "HEMMLOCK Indiranagar",
    city: "Bengaluru",
    address: "No. 448, 100 Feet Road, Indiranagar, Bengaluru 560038",
    phone: "+91 80452 77310",
    timings: "11:00 AM – 10:00 PM, All days",
    flagship: true,
  },
  {
    id: "st-03",
    name: "HEMMLOCK Khan Market",
    city: "New Delhi",
    address: "24A, Middle Lane, Khan Market, New Delhi 110003",
    phone: "+91 11 4106 8820",
    timings: "10:30 AM – 9:00 PM, Closed Mondays",
  },
  {
    id: "st-04",
    name: "HEMMLOCK Banjara Hills",
    city: "Hyderabad",
    address: "Road No. 12, Banjara Hills, Hyderabad 500034",
    phone: "+91 40 2354 9911",
    timings: "11:00 AM – 9:30 PM, All days",
  },
  {
    id: "st-05",
    name: "HEMMLOCK Park Street",
    city: "Kolkata",
    address: "18 Park Street, Kolkata 700016",
    phone: "+91 33 4008 5522",
    timings: "11:00 AM – 9:00 PM, All days",
  },
  {
    id: "st-06",
    name: "HEMMLOCK Anna Nagar",
    city: "Chennai",
    address: "2nd Avenue, Anna Nagar East, Chennai 600102",
    phone: "+91 44 4300 7788",
    timings: "11:00 AM – 9:30 PM, All days",
  },
  {
    id: "st-07",
    name: "HEMMLOCK Koregaon Park",
    city: "Pune",
    address: "Lane 7, Koregaon Park, Pune 411001",
    phone: "+91 20 2615 4477",
    timings: "11:00 AM – 9:30 PM, All days",
  },
  {
    id: "st-08",
    name: "HEMMLOCK C.G. Road",
    city: "Ahmedabad",
    address: "C.G. Road, Navrangpura, Ahmedabad 380009",
    phone: "+91 79 4004 6611",
    timings: "11:00 AM – 9:00 PM, All days",
  },
];
