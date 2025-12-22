
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tv } from 'lucide-react';

const ChannelGuide = ({ selectedCountry }: { selectedCountry: string }) => {
  return (
    <Card className="bg-[#151922] border-[#343a4d] mt-6">
      <CardHeader>
        <CardTitle className="text-white text-lg flex items-center">
          <Tv className="h-5 w-5 text-[#ff5a36] mr-2" />
          Live Sports TV Guide
        </CardTitle>
        <p className="text-gray-400 text-sm">
          Real-time sports schedule and TV guide for all major sports
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="w-full">
          <style dangerouslySetInnerHTML={{
            __html: `
              .containerFrame {width: 100%;}
              .frameData {width: 100%;}
              .hosting{margin:20px; font-size:70%; padding:6px; border:1px solid #17628b; margin-bottom:10px;}
              .hosting a{font-weight:bold;color:#17628b;}
              .dataList{padding:20px;}
            `
          }} />
          
          <script dangerouslySetInnerHTML={{
            __html: `
              var eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
              var eventer = window[eventMethod];
              var messageEvent = eventMethod == "attachEvent" ? "onmessage" : "message";
              eventer(messageEvent,function(e) {
                if(typeof e.data == "number" && e.data > 100)
                  document.getElementById("outputFrame").height = e.data + "px";
              },false);
            `
          }} />
          
          <iframe
            className="frameData"
            id="outputFrame"
            src="https://sport-tv-guide.live/sportwidget/e56305453cb8?time_zone=Australia%2FSydney&fc=102,16,2,1,7,18&time12=0&sports=28,29,1,5,18,7,8,10,39,40,13&bg=f8f8f9&bgs=b7b7b7&grp=1&sd=0&lng=1"
            style={{
              position: 'relative',
              border: 'none',
              width: '100%',
              minHeight: '600px'
            }}
            frameBorder="0"
            title="Live Sports TV Guide"
          />
          
          <div className="p-2 text-center text-xs text-gray-400">
            Powered by{' '}
            <a 
              href="https://sport-tv-guide.live" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#ff5a36] hover:underline"
            >
              Live Sports TV Guide
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChannelGuide;
