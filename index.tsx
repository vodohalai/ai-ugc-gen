import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

// --- SEPAY CONFIGURATION (CẤU HÌNH THANH TOÁN) ---
// Bạn cần đăng ký tại https://my.sepay.vn để lấy các thông tin này
const SEPAY_CONFIG = {
  BANK_ACCOUNT: '0353725359', // Số tài khoản của bạn
  BANK_NAME: 'MBBank',        // Ngân hàng MBBank
  API_TOKEN: 'GZNU6VADSYMHBCRMA8BPPF9VMFNJQDPZNW1OFXXI8CWVAF5KPXE9XBLJYSIOKDTI', // Token API SePay
  // Set FALSE để chạy thật, hệ thống sẽ kiểm tra giao dịch thực tế từ ngân hàng
  IS_SANDBOX: false 
};

// --- Types & Interfaces ---
interface User {
  username: string;
  fullName: string;
  credits: number;
}

// --- Auth Component ---
const AuthScreen = ({ onLogin }: { onLogin: (user: User) => void }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const users = JSON.parse(localStorage.getItem('users_db') || '[]');

    if (isLogin) {
      // Login Logic
      const user = users.find((u: any) => u.username === formData.username && u.password === formData.password);
      if (user) {
        // Ensure legacy users have credits field
        if (typeof user.credits === 'undefined') user.credits = 100;
        localStorage.setItem('current_session', JSON.stringify(user));
        onLogin(user);
      } else {
        setError('Tên đăng nhập hoặc mật khẩu không đúng.');
      }
    } else {
      // Register Logic
      if (!formData.username || !formData.password || !formData.fullName) {
        setError('Vui lòng điền đầy đủ thông tin.');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Mật khẩu xác nhận không khớp.');
        return;
      }
      if (users.find((u: any) => u.username === formData.username)) {
        setError('Tên đăng nhập đã tồn tại.');
        return;
      }

      // Default: Give 100 credits ($1) for new users to trial
      const newUser = { 
        username: formData.username, 
        password: formData.password, 
        fullName: formData.fullName,
        credits: 100 
      };
      
      users.push(newUser);
      localStorage.setItem('users_db', JSON.stringify(users));
      
      // Auto login after register
      localStorage.setItem('current_session', JSON.stringify(newUser));
      onLogin(newUser);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="bg-primary p-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-2">AI UGC Gen</h2>
          <p className="text-indigo-100">Nền tảng tạo video tự động</p>
        </div>
        
        <div className="p-8">
          <div className="flex gap-4 mb-8 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
            <button 
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${isLogin ? 'bg-white dark:bg-gray-600 shadow text-primary' : 'text-gray-500 dark:text-gray-300 hover:text-gray-700'}`}
              onClick={() => { setIsLogin(true); setError(''); }}
            >
              Đăng Nhập
            </button>
            <button 
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${!isLogin ? 'bg-white dark:bg-gray-600 shadow text-primary' : 'text-gray-500 dark:text-gray-300 hover:text-gray-700'}`}
              onClick={() => { setIsLogin(false); setError(''); }}
            >
              Đăng Ký
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Họ và Tên</label>
                <input
                  type="text"
                  name="fullName"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-gray-50 dark:bg-gray-700 dark:text-white"
                  placeholder="Nguyễn Văn A"
                  value={formData.fullName}
                  onChange={handleChange}
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tên đăng nhập</label>
              <input
                type="text"
                name="username"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-gray-50 dark:bg-gray-700 dark:text-white"
                placeholder="username"
                value={formData.username}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mật khẩu</label>
              <input
                type="password"
                name="password"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-gray-50 dark:bg-gray-700 dark:text-white"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Xác nhận mật khẩu</label>
                <input
                  type="password"
                  name="confirmPassword"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-gray-50 dark:bg-gray-700 dark:text-white"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>
            )}

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            <button type="submit" className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/30">
              {isLogin ? 'Đăng Nhập' : 'Tạo Tài Khoản (+100 Credits)'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// --- Credit Packages ---
const EXCHANGE_RATE = 25000; // 1 USD = 25,000 VND

const CREDIT_PACKAGES = [
  { price: 5, priceVnd: 125000, credits: 500, label: 'Starter', bonus: 0 },
  { price: 20, priceVnd: 500000, credits: 2000, label: 'Phổ biến', bonus: 0 },
  { price: 50, priceVnd: 1250000, credits: 5000, label: 'Pro', bonus: 500 }, // 10% bonus
  { price: 100, priceVnd: 2500000, credits: 10000, label: 'Business', bonus: 2000 }, // 20% bonus
];

const COST_GENERATE = 30;
const COST_EXTEND = 20;

// --- Main App Logic ---

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [apiKeyReady, setApiKeyReady] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [productDescription, setProductDescription] = useState('');
  const [prompt, setPrompt] = useState('');
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [lastOperation, setLastOperation] = useState<any>(null);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  
  // Payment States
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [paymentContent, setPaymentContent] = useState('');
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [lastCheckedTime, setLastCheckedTime] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Check for existing session
    const session = localStorage.getItem('current_session');
    if (session) {
      setUser(JSON.parse(session));
    }
    
    const saved = localStorage.getItem('ugc_saved_prompt');
    if (saved) setPrompt(saved);
  }, []);

  // Check API key only when user is logged in
  useEffect(() => {
    if (user) {
      checkApiKey();
    }
  }, [user]);

  // Payment Polling Effect
  useEffect(() => {
    let interval: any;
    
    const checkPayment = async () => {
       if (!selectedPackage || !paymentContent || SEPAY_CONFIG.IS_SANDBOX) return;
       
       setIsCheckingPayment(true);
       try {
          // Add timestamp to prevent caching & limit to 20 for wider search
          const targetUrl = `https://my.sepay.vn/userapi/transactions/list?token=${SEPAY_CONFIG.API_TOKEN}&limit=20&_cb=${Date.now()}`;
          // Use CORS Proxy to bypass browser restrictions
          const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
          
          const response = await fetch(proxyUrl);
          
          // Handle non-JSON responses (proxy errors)
          const text = await response.text();
          let data;
          try {
            data = JSON.parse(text);
          } catch (e) {
            console.warn("SePay/Proxy response was not valid JSON:", text.substring(0, 100));
            // Don't throw here, just return to keep polling alive
            return;
          }
          
          if (data.status === 200 && data.transactions) {
            // Fuzzy match: ignore case and spaces
            const searchContent = paymentContent.toLowerCase().replace(/\s/g, '');

            const found = data.transactions.find((t: any) => {
              const transContent = (t.transaction_content || '').toLowerCase().replace(/\s/g, '');
              // Check if content matches and amount is sufficient
              return transContent.includes(searchContent) && t.amount_in >= selectedPackage.priceVnd;
            });

            if (found) {
              handleTopUpSuccess(selectedPackage);
              if (interval) clearInterval(interval);
            }
          }
          setLastCheckedTime(new Date().toLocaleTimeString());
       } catch (error) {
          console.warn("Payment checking error (likely CORS or network):", error);
       } finally {
          setIsCheckingPayment(false);
       }
    };

    if (selectedPackage && paymentContent && !SEPAY_CONFIG.IS_SANDBOX) {
      // Check immediately
      checkPayment();
      // Then poll every 5 seconds to reduce rate limit issues
      interval = setInterval(checkPayment, 5000); 
    }

    return () => {
      if (interval) clearInterval(interval);
      setIsCheckingPayment(false);
    };
  }, [selectedPackage, paymentContent]);


  const handleLogout = () => {
    localStorage.removeItem('current_session');
    setUser(null);
    setApiKeyReady(false); // Reset API readiness
  };

  const updateUserCredits = (newCredits: number) => {
    if (!user) return;
    const updatedUser = { ...user, credits: newCredits };
    setUser(updatedUser);
    localStorage.setItem('current_session', JSON.stringify(updatedUser));

    // Update in main db as well
    const users = JSON.parse(localStorage.getItem('users_db') || '[]');
    const userIndex = users.findIndex((u: any) => u.username === user.username);
    if (userIndex !== -1) {
      users[userIndex].credits = newCredits;
      localStorage.setItem('users_db', JSON.stringify(users));
    }
  };

  const handleSelectPackage = (pkg: any) => {
    const code = `UGC${Math.floor(1000 + Math.random() * 9000)}`;
    setPaymentContent(code);
    setSelectedPackage(pkg);
    setLastCheckedTime('');
  };

  const handleTopUpSuccess = (pkg: any) => {
    if (!user) return;
    const amount = pkg.credits + pkg.bonus;
    const newBalance = user.credits + amount;
    updateUserCredits(newBalance);
    alert(`Nạp thành công ${amount} Credits! Cảm ơn bạn.`);
    // Reset payment state
    setSelectedPackage(null);
    setPaymentContent('');
    setShowTopUpModal(false);
  };

  // Simulation for Sandbox Mode or Manual Override
  const handleSimulatePayment = () => {
     if(selectedPackage) handleTopUpSuccess(selectedPackage);
  };
  
  const handleManualCheck = async () => {
      if (!selectedPackage || !paymentContent) return;
      setIsCheckingPayment(true);
      try {
           const targetUrl = `https://my.sepay.vn/userapi/transactions/list?token=${SEPAY_CONFIG.API_TOKEN}&limit=20&_cb=${Date.now()}`;
          // Use CORS Proxy
          const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
          
          const response = await fetch(proxyUrl);
          const text = await response.text();
          let data;
          
          try {
            data = JSON.parse(text);
          } catch(e) {
            alert("Lỗi kết nối đến máy chủ thanh toán (Proxy Error). Vui lòng thử lại sau vài giây.");
            return;
          }

          if (data.status === 200 && data.transactions) {
            const searchContent = paymentContent.toLowerCase().replace(/\s/g, '');
            const found = data.transactions.find((t: any) => {
               const transContent = (t.transaction_content || '').toLowerCase().replace(/\s/g, '');
               return transContent.includes(searchContent) && t.amount_in >= selectedPackage.priceVnd;
            });

            if (found) {
              handleTopUpSuccess(selectedPackage);
            } else {
              alert("Chưa tìm thấy giao dịch. Nếu bạn vừa chuyển, vui lòng đợi thêm 1-2 phút.");
            }
          } else {
             alert("Không thể lấy dữ liệu giao dịch. Vui lòng thử lại.");
          }
          setLastCheckedTime(new Date().toLocaleTimeString());
      } catch (e) {
          alert("Lỗi kết nối mạng.");
          console.error(e);
      } finally {
          setIsCheckingPayment(false);
      }
  };


  const checkApiKey = async () => {
    // @ts-ignore
    if (window.aistudio && window.aistudio.hasSelectedApiKey) {
      // @ts-ignore
      const hasKey = await window.aistudio.hasSelectedApiKey();
      setApiKeyReady(hasKey);
    } else {
        setApiKeyReady(true);
    }
  };

  const handleSelectKey = async () => {
    // @ts-ignore
    if (window.aistudio && window.aistudio.openSelectKey) {
        // @ts-ignore
        await window.aistudio.openSelectKey();
        checkApiKey();
    }
  };

  const resizeImage = (base64Str: string, maxWidth = 1024): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85)); 
      };
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const rawBase64 = reader.result as string;
        try {
            const resized = await resizeImage(rawBase64);
            setImage(resized);
        } catch (err) {
            console.error("Error resizing image", err);
            setImage(rawBase64); // Fallback to original if resize fails
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const generatePrompt = async () => {
    if (!image) return;
    setIsGeneratingPrompt(true);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const base64Image = image.split(',')[1];
      const mimeType = image.split(';')[0].split(':')[1];

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Image,
                mimeType: mimeType
              }
            },
            {
              text: `Bạn là một đạo diễn video TikTok/Shorts chuyên nghiệp. Hãy viết một prompt (mô tả video) để tạo video từ hình ảnh sản phẩm này.
              
              Thông tin bổ sung về sản phẩm: "${productDescription}"

              Yêu cầu nội dung:
              1. Nhân vật: Một người dùng (KOL/KOC) cầm sản phẩm, biểu cảm hào hứng, thích thú trải nghiệm.
              2. Hành động đầu tiên: Nhân vật bắt đầu nói ngay từ giây đầu tiên (lip-syncing/talking to camera) về sản phẩm.
              3. Cảm xúc: Tự nhiên, chân thật, như người dùng thực tế đang chia sẻ, không diễn quá lố (authentic UGC vibe).
              4. Góc quay: Quay cận cảnh hoặc trung cảnh, chuẩn 9:16.
              5. Hành động kết thúc: Ở cuối video, nhân vật phải chỉ tay xuống "GÓC TRÁI MÀN HÌNH" (nơi thường có giỏ hàng) để kêu gọi mua hàng.
              6. Ngôn ngữ: Tiếng Việt.
              7. Giọng nói (BẮT BUỘC): Giọng nữ miền Nam (Sài Gòn), dễ thương, hào hứng.
              
              Output: Chỉ trả về đoạn văn mô tả video (prompt) để nạp vào mô hình tạo video, không thêm lời dẫn.`
            }
          ]
        }
      });

      if (response.text) {
        setPrompt(response.text.trim());
      }
    } catch (error) {
      console.error("Error generating prompt:", error);
      alert("Failed to generate prompt. Please try again.");
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  const savePrompt = () => {
    localStorage.setItem('ugc_saved_prompt', prompt);
    alert("Prompt đã được lưu! Các sản phẩm sau sẽ tự động sử dụng mẫu này nếu bạn không tạo mới.");
  };

  const pollVideoOperation = async (initialOperation: any, ai: GoogleGenAI) => {
    let operation = initialOperation;
    
    while (!operation.done) {
      setStatusMessage('Veo 3.1 đang tạo video (Khoảng 1-2 phút)...');
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    if (operation.error) {
        throw new Error(operation.error.message || "Video generation failed");
    }

    return operation;
  };

  const fetchVideo = async (uri: string) => {
      setStatusMessage('Đang tải video...');
      const response = await fetch(`${uri}&key=${process.env.API_KEY}`);
      const blob = await response.blob();
      return URL.createObjectURL(blob);
  }

  const generateVideo = async () => {
    if (!prompt || !image || !user) return;
    
    if (user.credits < COST_GENERATE) {
      setShowTopUpModal(true);
      return;
    }

    setIsGeneratingVideo(true);
    setVideoUrl(null);
    setLastOperation(null);
    setStatusMessage('Đang khởi tạo Veo 3.1...');

    try {
      // Deduct credits
      updateUserCredits(user.credits - COST_GENERATE);

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const base64Image = image.split(',')[1];
      const mimeType = image.split(';')[0].split(':')[1];

      // Using fast model for better stability
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview', 
        prompt: prompt,
        image: {
            imageBytes: base64Image,
            mimeType: mimeType,
        },
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '9:16'
        }
      });

      const finishedOp = await pollVideoOperation(operation, ai);
      setLastOperation(finishedOp);

      const downloadLink = finishedOp.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        const url = await fetchVideo(downloadLink);
        setVideoUrl(url);
      } else {
        throw new Error("No video URI returned");
      }

    } catch (error) {
      console.error(error);
      alert("Error generating video: " + (error as any).message);
      // Refund on error (optional, but good UX)
      // updateUserCredits(user.credits + COST_GENERATE);
    } finally {
      setIsGeneratingVideo(false);
      setStatusMessage('');
    }
  };

  const getContinuationPrompt = async (currentPrompt: string) => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          parts: [{
            text: `Dưới đây là prompt của đoạn video trước đó:
            "${currentPrompt}"
            
            Hãy viết một prompt ngắn gọn (1-2 câu) mô tả diễn biến tiếp theo cho 5 giây mở rộng của video này.
            Yêu cầu:
            1. Đảm bảo tính liên tục về hành động và cảm xúc (visual continuity).
            2. Nếu đoạn trước kết thúc bằng việc chỉ tay vào giỏ hàng, đoạn này nhân vật nên làm hành động chốt lại (ví dụ: cười tươi gật đầu, đưa sản phẩm lại gần camera mời gọi, hoặc thả tim).
            3. Nhân vật vẫn đang nói (lip-syncing) để khớp với mạch video như thể họ đang nói lời chào tạm biệt hoặc kêu gọi hành động cuối cùng.
            4. Yêu cầu bắt buộc: Ghi rõ trong prompt kết quả là nhân vật nói "giọng miền Nam (Sài Gòn)" để đảm bảo thống nhất âm thanh với video trước.
            
            Output: Chỉ trả về text mô tả.`
          }]
        }
      });
      return response.text?.trim() || "Nhân vật cười tươi, đưa sản phẩm lại gần camera và gật đầu hài lòng, nói giọng miền Nam (Sài Gòn).";
    } catch (e) {
      console.error("Error getting continuation prompt", e);
      return "Tiếp tục diễn biến video một cách tự nhiên, nhân vật cười tươi tương tác với ống kính, giọng nói miền Nam (Sài Gòn).";
    }
  };

  const extendVideo = async () => {
      if (!lastOperation?.response?.generatedVideos?.[0]?.video || !user) return;
      
      if (user.credits < COST_EXTEND) {
        setShowTopUpModal(true);
        return;
      }

      setIsGeneratingVideo(true);
      setStatusMessage('Đang phân tích ngữ cảnh để mở rộng...');
      
      try {
          // Deduct credits
          updateUserCredits(user.credits - COST_EXTEND);

          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const previousVideo = lastOperation.response.generatedVideos[0].video;

          // 1. Generate intelligent continuation prompt
          const extensionPrompt = await getContinuationPrompt(prompt);
          setStatusMessage('Veo 3.1 đang mở rộng video...');
          console.log("Extension Prompt:", extensionPrompt);

          // 2. Generate video with new prompt
          // Using fast model to match the generation model
          let operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: extensionPrompt,
            video: previousVideo,
            config: {
                numberOfVideos: 1,
                resolution: '720p', // Only 720p supported for extension
                aspectRatio: '9:16' // Must match previous video
            }
          });

          const finishedOp = await pollVideoOperation(operation, ai);
          setLastOperation(finishedOp);

          const downloadLink = finishedOp.response?.generatedVideos?.[0]?.video?.uri;
          if (downloadLink) {
              const url = await fetchVideo(downloadLink);
              setVideoUrl(url);
          }

      } catch (error) {
          console.error(error);
          alert("Error extending video: " + (error as any).message);
      } finally {
          setIsGeneratingVideo(false);
          setStatusMessage('');
      }
  };

  // --- Render Conditionals ---

  if (!user) {
    return <AuthScreen onLogin={setUser} />;
  }

  if (!apiKeyReady) {
    return (
      <div className="fixed inset-0 bg-background-dark/90 z-50 flex flex-col items-center justify-center p-8 text-center text-white">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-2xl font-bold mb-4">
              {user.fullName.charAt(0)}
            </div>
            <h2 className="text-xl">Xin chào, {user.fullName}</h2>
          </div>
          
          <h2 className="text-2xl font-bold mb-4">Kích hoạt Veo 3.1</h2>
          <p className="mb-6 text-gray-400 max-w-lg">Vui lòng chọn API Key từ dự án có liên kết thanh toán (Billing enabled) để bắt đầu tạo video.</p>
          <button 
            onClick={handleSelectKey}
            className="px-6 py-3 rounded-lg font-semibold bg-primary text-white hover:brightness-110 transition-all shadow-lg"
          >
            Kết nối API Key
          </button>
          
          <button onClick={handleLogout} className="mt-8 text-sm text-gray-400 hover:text-white underline">
            Đăng xuất
          </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 lg:p-8 relative">
      <header className="w-full max-w-7xl flex flex-col sm:flex-row items-center justify-between mb-10 gap-4">
        <div className="text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl font-bold text-primary">AI UGC Video Generator</h1>
          <p className="mt-2 text-base text-gray-600 dark:text-gray-400">
            Biến ảnh sản phẩm thành video quảng cáo triệu view
          </p>
        </div>
        
        {/* User Profile & Credits */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end mr-2">
            <div className="flex items-center gap-1 font-bold text-gray-800 dark:text-white">
              <span className="material-symbols-outlined text-yellow-500">account_balance_wallet</span>
              <span>{user.credits.toLocaleString()} Credits</span>
            </div>
            <button 
              onClick={() => setShowTopUpModal(true)}
              className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">add_circle</span>
              Nạp thêm
            </button>
          </div>

          <div className="flex items-center gap-4 bg-white dark:bg-gray-800 p-2 pr-4 rounded-full shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col mr-2">
              <span className="text-sm font-semibold text-gray-800 dark:text-white leading-tight">{user.fullName}</span>
              <span className="text-xs text-gray-500">User</span>
            </div>
            <button 
              onClick={handleLogout}
              className="text-gray-400 hover:text-red-500 transition-colors"
              title="Đăng xuất"
            >
              <span className="material-symbols-outlined text-xl">logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 flex flex-col gap-8">
          {/* Upload Section */}
          <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-5 text-gray-900 dark:text-white">1. Upload & Thông Tin Sản Phẩm</h2>
            <div className="space-y-6">
              <div 
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-primary dark:hover:border-primary transition-colors flex flex-col items-center justify-center min-h-[200px]"
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  hidden 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                />
                
                {image ? (
                  <img src={image} alt="Uploaded product" className="max-h-[300px] w-auto rounded-md object-contain" />
                ) : (
                  <>
                    <span className="material-symbols-outlined text-5xl text-gray-400 dark:text-gray-500 mx-auto">upload_file</span>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      Kéo thả hoặc <span className="font-semibold text-primary">click để upload ảnh</span>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Hỗ trợ JPG, PNG</p>
                  </>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="product-description">
                  Mô tả sản phẩm (Tuỳ chọn)
                </label>
                <textarea 
                  id="product-description"
                  className="w-full bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary focus:border-primary dark:text-white dark:placeholder-gray-400 p-3"
                  placeholder="Nhập thông tin sản phẩm (công dụng, thành phần, điểm nổi bật...) để AI tạo prompt chính xác hơn." 
                  rows={3}
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* Prompt Section */}
          <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-5 text-gray-900 dark:text-white">2. AI Tạo Kịch Bản (Prompt)</h2>
            <div className="space-y-6">
              <button 
                type="button"
                onClick={generatePrompt}
                disabled={!image || isGeneratingPrompt}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold rounded-md bg-primary/10 dark:bg-primary/20 text-primary hover:bg-primary/20 dark:hover:bg-primary/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGeneratingPrompt ? (
                  <span className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></span>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1, 'wght' 600" }}>auto_awesome</span>
                    Tạo Prompt Tự Động
                  </>
                )}
              </button>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="custom-prompt">
                  Tuỳ chỉnh Prompt (Tiếng Việt)
                </label>
                <textarea 
                  id="custom-prompt"
                  className="w-full bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary focus:border-primary dark:text-white dark:placeholder-gray-400 p-3"
                  placeholder="Mô tả video sẽ hiện ở đây..." 
                  rows={4}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <button 
                  type="button"
                  onClick={savePrompt}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 py-2.5 px-5 text-sm font-medium rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">save</span>
                  Lưu Prompt
                </button>
                
                <button 
                  type="button"
                  onClick={generateVideo}
                  disabled={!prompt || !image || isGeneratingVideo}
                  className={`w-full sm:w-auto flex-1 flex items-center justify-center gap-2 py-2.5 px-5 text-sm font-semibold rounded-md text-white transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${user.credits < COST_GENERATE ? 'bg-gray-400' : 'bg-primary hover:bg-primary/90'}`}
                >
                  {isGeneratingVideo ? (
                    <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-lg">movie</span>
                      Tạo Video (-{COST_GENERATE} Credits)
                    </>
                  )}
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* Video Result Section */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md sticky top-8">
            <h2 className="text-xl font-bold mb-5 text-gray-900 dark:text-white">Kết Quả Video</h2>
            
            {/* Aspect Ratio Container: 9:16 */}
            <div className="relative w-full pb-[177.78%] bg-black rounded-lg overflow-hidden border border-gray-700">
               {isGeneratingVideo ? (
                 <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                    <div className="animate-spin h-10 w-10 border-4 border-gray-500 border-t-primary rounded-full mb-4"></div>
                    <p className="text-gray-300 animate-pulse">{statusMessage}</p>
                 </div>
               ) : videoUrl ? (
                 <video src={videoUrl} controls autoPlay loop playsInline className="absolute inset-0 w-full h-full object-contain" />
               ) : (
                 <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                    <p>Video sẽ xuất hiện ở đây</p>
                 </div>
               )}
            </div>

            {videoUrl && !isGeneratingVideo && (
              <button 
                type="button"
                onClick={extendVideo}
                className={`mt-4 w-full flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium rounded-md text-white transition-colors ${user.credits < COST_EXTEND ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-700 hover:bg-gray-600'}`}
              >
                <span className="material-symbols-outlined text-lg">add_circle</span>
                Extend 5s (-{COST_EXTEND} Credits)
              </button>
            )}

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
               <p className="text-xs text-gray-500 dark:text-gray-400">
                 Note: Quá trình tạo video Veo 3.1 có thể mất 1-3 phút. Vui lòng giữ nguyên trang web.
               </p>
            </div>
          </div>
        </div>
      </main>

      {/* Top-up Modal */}
      {showTopUpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className="bg-primary p-4 flex justify-between items-center shrink-0">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined">account_balance_wallet</span>
                {selectedPackage ? 'Thanh toán QR' : 'Nạp Credit'}
              </h3>
              <button onClick={() => { setShowTopUpModal(false); setSelectedPackage(null); }} className="text-white/80 hover:text-white">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {!selectedPackage ? (
                <>
                  <p className="text-gray-600 dark:text-gray-300 mb-6 text-center">
                    Chọn gói nạp để tiếp tục tạo video chất lượng cao. <br/>
                    <span className="text-sm italic opacity-75">Tỷ giá: $1 = {EXCHANGE_RATE.toLocaleString()}đ</span>
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {CREDIT_PACKAGES.map((pkg) => (
                      <button
                        key={pkg.price}
                        onClick={() => handleSelectPackage(pkg)}
                        className="relative border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-primary dark:hover:border-primary hover:bg-primary/5 transition-all text-left group"
                      >
                        {pkg.label && (
                          <span className="absolute -top-3 right-4 bg-primary text-white text-xs px-2 py-0.5 rounded-full">
                            {pkg.label}
                          </span>
                        )}
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-2xl font-bold text-gray-800 dark:text-white">${pkg.price}</span>
                          {pkg.bonus > 0 && (
                            <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded">
                              +{pkg.bonus} Bonus
                            </span>
                          )}
                        </div>
                         <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                           = {pkg.priceVnd.toLocaleString()} VND
                        </div>
                        <div className="text-lg font-semibold text-primary">{(pkg.credits + pkg.bonus).toLocaleString()} Credits</div>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="mb-4 text-center">
                    <p className="text-sm text-gray-500">Quét mã để thanh toán</p>
                    <p className="text-2xl font-bold text-primary">{selectedPackage.priceVnd.toLocaleString()} VND</p>
                  </div>

                  {/* Dynamic VietQR Generation */}
                  <div className="bg-white p-2 rounded-lg border shadow-sm mb-4">
                    <img 
                      src={`https://qr.sepay.vn/img?acc=${SEPAY_CONFIG.BANK_ACCOUNT}&bank=${SEPAY_CONFIG.BANK_NAME}&amount=${selectedPackage.priceVnd}&des=${paymentContent}`} 
                      alt="VietQR"
                      className="w-48 h-48 sm:w-64 sm:h-64 object-contain"
                    />
                  </div>

                  <div className="w-full bg-gray-100 dark:bg-gray-700 p-4 rounded-md mb-4 text-center">
                    <p className="text-sm text-gray-500 mb-1">Nội dung chuyển khoản (Bắt buộc):</p>
                    <p className="text-lg font-mono font-bold text-gray-800 dark:text-white select-all cursor-pointer bg-white dark:bg-gray-600 p-2 rounded border border-dashed border-gray-400">
                      {paymentContent}
                    </p>
                    <p className="text-xs text-red-500 mt-2">Vui lòng nhập đúng nội dung để được cộng tiền tự động.</p>
                  </div>

                  <div className="flex flex-col items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <div className="flex items-center gap-2">
                        {isCheckingPayment && <span className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></span>}
                        <span>Đang chờ thanh toán... (Tự động)</span>
                    </div>
                    {lastCheckedTime && (
                         <span className="text-xs text-gray-400">Cập nhật lần cuối: {lastCheckedTime}</span>
                    )}
                  </div>

                  <button 
                     onClick={handleManualCheck}
                     className="mt-4 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 text-sm rounded font-medium transition-colors"
                  >
                     Kiểm tra thanh toán ngay
                  </button>

                  <button 
                     onClick={() => setSelectedPackage(null)}
                     className="mt-6 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-white underline"
                  >
                    &larr; Chọn gói khác
                  </button>

                  {SEPAY_CONFIG.IS_SANDBOX && (
                      <button onClick={handleSimulatePayment} className="mt-4 px-4 py-2 bg-green-600 text-white rounded text-xs">
                          (Dev Only) Giả lập thanh toán thành công
                      </button>
                  )}
                </div>
              )}
            </div>
            
            {!selectedPackage && (
               <div className="p-4 bg-gray-50 dark:bg-gray-700 text-center text-xs text-gray-500 dark:text-gray-400 shrink-0">
                  Hệ thống sử dụng cổng thanh toán tự động SePay. Tiền sẽ vào ví ngay lập tức.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const root = createRoot(document.getElementById('app')!);
root.render(<App />);