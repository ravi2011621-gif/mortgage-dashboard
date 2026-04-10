export const metadata = {
  title: "Mortgage Dashboard",
  description: "Mortgage and macro dashboard",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: "Arial, Helvetica, sans-serif",
          background: "#f8fafc",
        }}
      >
        {children}
      </body>
    </html>
  );
}
