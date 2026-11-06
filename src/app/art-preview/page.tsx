import { BarberScene, CornerShopScene, GarageScene, HeroHandover, PharmacyScene, TailorScene } from "@/components/art";

export const metadata = { title: "Art preview" };

export default function ArtPreview() {
  const card = { width: 320, borderRadius: 18, overflow: "hidden", boxShadow: "0 10px 30px rgba(29,43,36,.15)" } as const;
  return (
    <main style={{ background: "#f8f2e6", minHeight: "100vh", padding: 32 }}>
      <div style={{ maxWidth: 640, borderRadius: 22, overflow: "hidden", margin: "0 auto 32px", boxShadow: "0 10px 30px rgba(29,43,36,.15)" }}>
        <HeroHandover />
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 24, justifyContent: "center" }}>
        {[BarberScene, GarageScene, PharmacyScene, TailorScene, CornerShopScene].map((S, i) => (
          <div key={i} style={card}>
            <S />
          </div>
        ))}
      </div>
    </main>
  );
}
