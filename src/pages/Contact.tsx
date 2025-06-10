
import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { useToast } from '../hooks/use-toast';
import { Send, Heart, Copy, ExternalLink } from 'lucide-react';

const Contact: React.FC = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  // Временные адреса - позже заменить на реальные
  const cryptoAddresses = {
    usdt: 'TXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXx',
    ton: 'EQXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXx'
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Здесь будет интеграция с Telegram Bot API
      console.log('Sending message:', formData);
      
      // Симуляция отправки
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: t.common.success,
        description: "Сообщение отправлено успешно!",
      });
      
      setFormData({ name: '', email: '', message: '' });
    } catch (error) {
      toast({
        title: t.common.error,
        description: "Произошла ошибка при отправке",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const copyToClipboard = (address: string, type: string) => {
    navigator.clipboard.writeText(address);
    toast({
      title: t.contact.support.modal.copied,
      description: `${type} адрес скопирован в буфер обмена`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in">
          <h1 className="font-playfair text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            {t.contact.title}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t.contact.subtitle}
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contact Form */}
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="w-5 h-5" />
                Связаться со мной
              </CardTitle>
              <CardDescription>
                Напишите мне о ваших идеях, проектах или предложениях
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">{t.contact.form.name}</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                    className="transition-all duration-300 focus:ring-2 focus:ring-accent"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">{t.contact.form.email}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                    className="transition-all duration-300 focus:ring-2 focus:ring-accent"
                  />
                </div>
                
                <div>
                  <Label htmlFor="message">{t.contact.form.message}</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    required
                    rows={5}
                    className="transition-all duration-300 focus:ring-2 focus:ring-accent"
                  />
                </div>
                
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full transition-all duration-300 hover:scale-105"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
                      {t.common.loading}
                    </div>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      {t.contact.form.send}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Support Project */}
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-accent" />
                {t.contact.support.title}
              </CardTitle>
              <CardDescription>
                {t.contact.support.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/30 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground mb-4">
                  Поддержите развитие инновационных проектов в области ML/AI и стартап-экосистемы
                </p>
                <Button 
                  onClick={() => setIsModalOpen(true)}
                  className="w-full transition-all duration-300 hover:scale-105"
                  variant="outline"
                >
                  <Heart className="w-4 h-4 mr-2" />
                  {t.contact.support.button}
                </Button>
              </div>
              
              <div className="flex flex-col space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4" />
                  <span>Telegram: @eremey_dmitrienko</span>
                </div>
                <div className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4" />
                  <span>LinkedIn: Eremey Dmitrienko</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Support Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-accent" />
              {t.contact.support.modal.title}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
              {t.contact.support.modal.description}
            </p>
            
            {/* USDT */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t.contact.support.modal.usdt}</Label>
              <div className="flex items-center space-x-2">
                <Input
                  value={cryptoAddresses.usdt}
                  readOnly
                  className="text-xs"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(cryptoAddresses.usdt, 'USDT')}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {/* TON */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t.contact.support.modal.ton}</Label>
              <div className="flex items-center space-x-2">
                <Input
                  value={cryptoAddresses.ton}
                  readOnly
                  className="text-xs"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(cryptoAddresses.ton, 'TON')}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <Button 
              onClick={() => setIsModalOpen(false)}
              className="w-full"
            >
              {t.contact.support.modal.close}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Contact;
