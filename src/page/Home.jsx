import img from "../assets/ludoimage.png";
import { Link, useNavigate } from "react-router-dom";
import { Download } from "lucide-react";
import { useEffect, useState } from "react";
import useWalletStore from "../store/walletStore";
import useAdsStore from "../store/adsStore";

function Home() {
  const navigate = useNavigate();
  const { balance, getBalance } = useWalletStore();
  const { ads, socialLinks, fetchAds, getCurrentImage } = useAdsStore();

  const [currentImageIndex, setCurrentImageIndex] = useState({
    adcode_1: 0,
    adcode_2: 0,
    adcode_3: 0,
  });

  useEffect(() => {
    getBalance();
    fetchAds();
  }, [getBalance, fetchAds]);

  useEffect(() => {
    const rotationInterval = setInterval(() => {
      setCurrentImageIndex((prev) => {
        const newIndex = { ...prev };
        if (ads.adcode_1 && ads.adcode_1.length > 1) {
          newIndex.adcode_1 = (prev.adcode_1 + 1) % ads.adcode_1.length;
        }
        if (ads.adcode_2 && ads.adcode_2.length > 1) {
          newIndex.adcode_2 = (prev.adcode_2 + 1) % ads.adcode_2.length;
        }
        if (ads.adcode_3 && ads.adcode_3.length > 1) {
          newIndex.adcode_3 = (prev.adcode_3 + 1) % ads.adcode_3.length;
        }
        return newIndex;
      });
    }, 3000);

    return () => clearInterval(rotationInterval);
  }, [ads]);

  return (
    <div className="arena-shell min-h-screen w-full flex flex-col">
      <div className="arena-flag-beam" />
      <div className="arena-orb arena-orb--gold" />
      <div className="arena-orb arena-orb--leaf" />
      <div className="arena-orb arena-orb--ember" />

      {/* Hero composition */}
      <section className="relative min-h-[72vh] flex flex-col items-center justify-center px-6 pt-10 pb-8 text-center overflow-hidden">
        <div
          className="absolute inset-0 z-0 opacity-40"
          style={{
            backgroundImage: `url(${img})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "saturate(1.15) brightness(0.45)",
          }}
        />
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#061410]/40 via-[#061410]/75 to-[#061410]" />

        <div className="relative z-10 flex flex-col items-center gap-5 max-w-md w-full">
          <p className="font-display text-[clamp(2.6rem,11vw,3.75rem)] leading-none brand-wordmark animate-rise-in">
            EthioLudo
          </p>
          <h1 className="font-display text-xl sm:text-2xl text-[#f6ead0] font-semibold tracking-tight animate-fade-rise stagger-2">
            Roll. Race. Win ብር.
          </h1>
          <p className="text-sm sm:text-base text-[#c9dfd3]/90 max-w-xs animate-fade-rise stagger-3">
            Real-stakes Ludo with friends — deposit, join a room, and claim the prize.
          </p>

          <div className="relative mt-2 animate-hero-float">
            <div className="absolute -inset-6 rounded-full bg-[radial-gradient(circle,rgba(240,193,75,0.35),transparent_70%)] blur-md" />
            <img
              src={img}
              alt="EthioLudo board"
              className="relative w-36 h-36 sm:w-44 sm:h-44 object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.55)]"
            />
          </div>

          <Link to="/game" className="w-full max-w-xs mt-2 animate-fade-rise stagger-4">
            <button className="btn-arena w-full py-3.5 text-lg animate-cta-breathe">
              Enter Arena
            </button>
          </Link>
        </div>
      </section>

      <main className="flex flex-col items-center gap-5 w-full px-5 pb-8">
        <div className="w-full max-w-md panel-arena px-4 py-3.5 flex justify-between items-center animate-fade-rise stagger-5">
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-[#f0c14b]/70 font-display">
              Balance
            </p>
            <p className="font-display text-xl font-bold text-[#f6ead0] flex items-center gap-1.5 mt-0.5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width={18}
                height={18}
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle cx="12" cy="12" r="10" fill="#F0C14B" />
                <ellipse cx="12" cy="16" rx="7" ry="2" fill="#D4A02A" />
                <circle cx="12" cy="12" r="7" fill="#F6D78A" />
                <ellipse cx="12" cy="10" rx="4" ry="1.2" fill="#FFF4C8" />
              </svg>
              {balance !== undefined
                ? `${balance.toFixed(2)} ብር`
                : "…"}
            </p>
          </div>
          <button
            onClick={() => navigate("/deposit")}
            className="btn-arena-ghost px-4 py-2 text-sm flex items-center gap-2"
          >
            <Download size={15} />
            Deposit
          </button>
        </div>

        <div className="w-full max-w-md h-28 rounded-2xl overflow-hidden border border-[rgba(240,193,75,0.18)] bg-[#102820]/80">
          {ads.adcode_1 && ads.adcode_1.length > 0 ? (
            <img
              src={
                getCurrentImage("adcode_1", currentImageIndex.adcode_1)?.url ||
                getCurrentImage("adcode_1", currentImageIndex.adcode_1)
              }
              alt="Advertisement"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-[#c9dfd3]/60">
              <p className="font-display text-sm">የማስታወቂያ ቦታ</p>
              <p className="text-xs mt-1">320×100</p>
            </div>
          )}
        </div>

        <div className="w-full max-w-md h-[180px] md:h-[280px] rounded-2xl overflow-hidden border border-[rgba(240,193,75,0.18)] bg-[#102820]/80">
          {ads.adcode_2 && ads.adcode_2.length > 0 ? (
            <img
              src={
                getCurrentImage("adcode_2", currentImageIndex.adcode_2)?.url ||
                getCurrentImage("adcode_2", currentImageIndex.adcode_2)
              }
              alt="Banner Advertisement"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-[#c9dfd3]/60">
              <p className="font-display text-lg">የባነር ቦታ</p>
              <p className="text-sm mt-1">Banner Space</p>
            </div>
          )}
        </div>

        <div className="w-full max-w-md h-28 rounded-2xl overflow-hidden border border-[rgba(240,193,75,0.18)] bg-[#102820]/80">
          {ads.adcode_3 && ads.adcode_3.length > 0 ? (
            <img
              src={
                getCurrentImage("adcode_3", currentImageIndex.adcode_3)?.url ||
                getCurrentImage("adcode_3", currentImageIndex.adcode_3)
              }
              alt="Mobile Advertisement"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-[#c9dfd3]/60">
              <p className="font-display text-sm">የማስታወቂያ ቦታ</p>
              <p className="text-xs mt-1">320×100</p>
            </div>
          )}
        </div>

        {(socialLinks.facebook ||
          socialLinks.tiktok ||
          socialLinks.instagram ||
          socialLinks.youtube ||
          socialLinks.telegram) && (
          <div className="w-full max-w-md panel-arena-soft p-4">
            <h2 className="font-display text-sm tracking-wide text-[#f0c14b] mb-3">
              Follow Us
            </h2>
            <div className="flex flex-wrap gap-3 justify-center">
              {socialLinks.facebook && (
                <a
                  href={socialLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-[#1877F2] text-white rounded-full flex items-center justify-center transition-transform hover:scale-110"
                  title="Facebook"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
              )}
              {socialLinks.tiktok && (
                <a
                  href={socialLinks.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-[#111] text-white rounded-full flex items-center justify-center transition-transform hover:scale-110"
                  title="TikTok"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                  </svg>
                </a>
              )}
              {socialLinks.instagram && (
                <a
                  href={socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white rounded-full flex items-center justify-center transition-transform hover:scale-110"
                  title="Instagram"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
              )}
              {socialLinks.youtube && (
                <a
                  href={socialLinks.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-[#FF0000] text-white rounded-full flex items-center justify-center transition-transform hover:scale-110"
                  title="YouTube"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </a>
              )}
              {socialLinks.telegram && (
                <a
                  href={socialLinks.telegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-[#229ED9] text-white rounded-full flex items-center justify-center transition-transform hover:scale-110"
                  title="Telegram"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                  </svg>
                </a>
              )}
            </div>
          </div>
        )}

        <div className="w-full max-w-md panel-arena-soft p-5">
          <h2 className="font-display text-sm tracking-wide text-[#f0c14b] mb-3">
            How It Works
          </h2>
          <ol className="space-y-3 text-sm text-[#c9dfd3]/90">
            {[
              "ገንዘብ አካውንቶ ውስጥ ያስገቡ",
              "ጌም ይቀላቀሉ ወይንም አዲስ ይፍጠሩ",
              "ይጫወቱ፣ ይወዳደሩ፣ ያሸንፉ።",
            ].map((step, i) => (
              <li key={step} className="flex gap-3 items-start">
                <span className="font-display shrink-0 w-6 h-6 rounded-full bg-[#f0c14b]/15 text-[#f0c14b] text-xs flex items-center justify-center border border-[#f0c14b]/35">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </main>
    </div>
  );
}

export default Home;
