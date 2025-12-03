import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Upload, ArrowLeft, Check } from 'lucide-react';
import { toast } from '../hooks/use-toast';

const UploadPage = () => {
  const [preview, setPreview] = useState(null);
  const [uploaded, setUploaded] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file.",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setPreview(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = () => {
    if (preview) {
      localStorage.setItem('flappyFaceImage', preview);
      setUploaded(true);
      toast({
        title: "Success!",
        description: "Face uploaded successfully! Ready to play.",
      });
      setTimeout(() => {
        navigate('/');
      }, 1500);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-pink-400 to-purple-500 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 bg-white rounded-3xl shadow-2xl">
        <Button
          onClick={() => navigate('/')}
          variant="ghost"
          className="mb-4 text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Game
        </Button>

        <h1 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-orange-500 to-pink-600 bg-clip-text text-transparent">
          Upload Your Friend's Face
        </h1>
        <p className="text-center text-gray-600 mb-6">Choose a photo to use in the game</p>

        <div className="space-y-6">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-4 border-dashed border-gray-300 rounded-2xl p-8 text-center cursor-pointer hover:border-orange-500 transition-all duration-300 bg-gray-50 hover:bg-orange-50"
          >
            {preview ? (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="relative">
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-40 h-40 rounded-full object-cover border-4 border-orange-500 shadow-lg"
                    />
                    {uploaded && (
                      <div className="absolute inset-0 bg-green-500/80 rounded-full flex items-center justify-center">
                        <Check className="h-16 w-16 text-white" />
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-600">Click to change photo</p>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="mx-auto h-16 w-16 text-gray-400" />
                <div>
                  <p className="text-lg font-semibold text-gray-700">Click to upload</p>
                  <p className="text-sm text-gray-500">PNG, JPG up to 10MB</p>
                </div>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {preview && !uploaded && (
            <Button
              onClick={handleUpload}
              className="w-full bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white font-bold py-6 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Save & Start Playing
            </Button>
          )}

          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Tip:</span> Use a clear face photo for best results. The face will appear as a circular character in the game!
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default UploadPage;