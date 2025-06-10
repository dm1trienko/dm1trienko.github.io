
import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { CultTechForm } from '../../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { useToast } from '../../hooks/use-toast';

interface CultTechModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CultTechModal: React.FC<CultTechModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<CultTechForm>({
    name: '',
    field: '',
    description: '',
    contact: '',
    tags: []
  });

  const [tagsInput, setTagsInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Parse tags from input
      const tags = tagsInput.split(',').map(tag => tag.trim()).filter(Boolean);
      
      const submissionData = {
        ...formData,
        tags
      };

      // Here would be the actual submission logic
      // For now, just simulate success
      console.log('Submitting:', submissionData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: t.common.success,
        description: "Предложение отправлено успешно!",
      });
      
      // Reset form
      setFormData({
        name: '',
        field: '',
        description: '',
        contact: '',
        tags: []
      });
      setTagsInput('');
      
      onClose();
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

  const handleInputChange = (field: keyof Omit<CultTechForm, 'tags'>, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.culttech.modal.title}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">{t.culttech.modal.name}</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="field">{t.culttech.modal.field}</Label>
            <Input
              id="field"
              value={formData.field}
              onChange={(e) => handleInputChange('field', e.target.value)}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="description">{t.culttech.modal.description}</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              required
              rows={3}
            />
          </div>
          
          <div>
            <Label htmlFor="contact">{t.culttech.modal.contact}</Label>
            <Input
              id="contact"
              value={formData.contact}
              onChange={(e) => handleInputChange('contact', e.target.value)}
              placeholder="@username или https://linkedin.com/in/username"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="tags">{t.culttech.modal.tags}</Label>
            <Input
              id="tags"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="Culture, IT, Entrepreneurship"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Разделите теги запятыми
            </p>
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
            >
              {t.culttech.modal.cancel}
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? t.common.loading : t.culttech.modal.submit}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CultTechModal;
