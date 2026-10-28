import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'Paridhan by Piyu | Clothing Rentals',description:'Rent Indian occasion wear from Paridhan by Piyu, owned by Priyansi Rupareliya. Explore outfits, request rental dates and plan your next celebration.',icons:{icon:'/assets/paridhan-logo.png'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
