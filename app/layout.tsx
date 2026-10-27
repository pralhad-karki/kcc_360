import type { Metadata } from 'next';
export const metadata: Metadata={title:'KCC360 Learning Workspace',description:'Private shared demonstration workspace for KCC360 SRS v3.0'};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="en"><body style={{margin:0}}>{children}</body></html>}
