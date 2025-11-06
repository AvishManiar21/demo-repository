import "@/styles/globals.css";
import { Inter } from "next/font/google";

export const metadata = {
  title: "Next Gallery (Supabase/Server Secure)",
  description: "A secure image gallery using Next.js and Supabase Storage.",
};

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen antialiased text-slate-100 bg-slate-950`}>
        <div className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}


