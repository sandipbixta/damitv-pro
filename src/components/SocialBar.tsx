
import React from 'react';
import { Share } from 'lucide-react';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger 
} from '@/components/ui/popover';
import { useIsMobile } from '../hooks/use-mobile';

const SocialBar = () => {
  const isMobile = useIsMobile();

  // Function to handle share click
  const handleShare = (platform: string) => {
    const url = window.location.href;
    const title = "Check out this live sports stream!";
    
    let shareUrl = "";
    
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(title + ' ' + url)}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
        break;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank');
    }
  };
  
  return (
    <>
      {/* Share button with popover */}
      <div className={`fixed ${isMobile ? 'bottom-16' : 'bottom-4'} right-4 z-40`}>
        <Popover>
          <PopoverTrigger asChild>
            <button className="bg-[#fa2d04] hover:bg-[#e02700] text-white p-2 sm:p-3 rounded-full shadow-lg">
              <Share className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2 bg-[#242836] border-[#343a4d]" side="top">
            <div className="flex gap-2">
              <button 
                onClick={() => handleShare('facebook')}
                className="bg-[#1877F2] hover:bg-[#0e63cf] text-white p-2 rounded-full"
                aria-label="Share on Facebook"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12.001 2.002c-5.522 0-9.999 4.477-9.999 9.999 0 4.99 3.656 9.126 8.437 9.879v-6.988h-2.54v-2.891h2.54V9.798c0-2.508 1.493-3.891 3.776-3.891 1.094 0 2.24.195 2.24.195v2.459h-1.264c-1.24 0-1.628.772-1.628 1.563v1.875h2.771l-.443 2.891h-2.328v6.988C18.344 21.129 22 16.992 22 12.001c0-5.522-4.477-9.999-9.999-9.999z"/>
                </svg>
              </button>
              <button 
                onClick={() => handleShare('twitter')}
                className="bg-[#1DA1F2] hover:bg-[#0c85d0] text-white p-2 rounded-full" 
                aria-label="Share on Twitter"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19.633 7.997c.013.175.013.349.013.523 0 5.325-4.053 11.461-11.46 11.461-2.282 0-4.402-.661-6.186-1.809.324.037.636.05.973.05 1.883 0 3.616-.636 5.001-1.721-1.771-.037-3.255-1.197-3.767-2.793.249.037.499.062.761.062.361 0 .724-.05 1.061-.137-1.847-.374-3.23-1.995-3.23-3.953v-.05c.537.299 1.16.486 1.82.511-1.086-.722-1.797-1.957-1.797-3.356 0-.748.199-1.434.548-2.032a11.457 11.457 0 008.306 4.215c-.062-.3-.1-.611-.1-.923a4.026 4.026 0 014.028-4.028c1.16 0 2.207.486 2.943 1.272a7.957 7.957 0 002.556-.973 4.02 4.02 0 01-1.771 2.22 8.073 8.073 0 002.319-.624 8.645 8.645 0 01-2.019 2.083z"/>
                </svg>
              </button>
              <button 
                onClick={() => handleShare('whatsapp')}
                className="bg-[#25D366] hover:bg-[#1da849] text-white p-2 rounded-full"
                aria-label="Share on WhatsApp"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564c.173.087.289.129.332.202.043.72.043.433-.101.823z" />
                  <path d="M11.999 1.9c-5.554 0-10.096 4.554-10.098 10.097a10.07 10.07 0 001.325 5l-1.326 4.836 4.898-1.283a10.101 10.101 0 005.201 1.424h.004c5.552 0 10.096-4.553 10.097-10.096A10.1 10.1 0 0011.999 1.9zm0 18.529h-.003a8.375 8.375 0 01-4.27-1.172l-.31-.183-3.173.831.847-3.093-.201-.323a8.361 8.361 0 01-1.286-4.49c.002-4.618 3.767-8.375 8.386-8.375 2.24.001 4.349.874 5.935 2.461a8.373 8.373 0 012.453 5.93c-.002 4.619-3.768 8.376-8.378 8.376z" />
                </svg>
              </button>
              <button 
                onClick={() => handleShare('telegram')}
                className="bg-[#0088cc] hover:bg-[#006daa] text-white p-2 rounded-full"
                aria-label="Share on Telegram"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </>
  );
};

export default SocialBar;
