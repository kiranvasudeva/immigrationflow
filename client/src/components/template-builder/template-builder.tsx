import { useState, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, GripVertical, Plus, Eye, Save } from 'lucide-react';
import { DocumentTemplate, TemplateField } from '@shared/schema';

interface TemplateBuilderProps {
  template?: DocumentTemplate;
  fields?: TemplateField[];
  onSave: (template: Partial<DocumentTemplate>, fields: Partial<TemplateField>[]) => void;
}

interface FieldConfig {
  id: string;
  fieldKey: string;
  fieldType: 'TEXT' | 'DATE' | 'NUMBER' | 'CHECKBOX' | 'DROPDOWN' | 'SIGNATURE' | 'PHOTO';
  label: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
  validation?: any;
}

const SortableField = ({ field, onUpdate, onDelete }: { 
  field: FieldConfig; 
  onUpdate: (id: string, updates: Partial<FieldConfig>) => void;
  onDelete: (id: string) => void;
}) => {
  const { t } = useLanguage();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="mb-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center space-x-2">
            <div {...attributes} {...listeners} className="cursor-grab">
              <GripVertical className="h-4 w-4 text-gray-400" />
            </div>
            <CardTitle className="text-sm">{field.label || 'Untitled Field'}</CardTitle>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onDelete(field.id)}
            className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor={`${field.id}-key`}>Field Key</Label>
              <Input
                id={`${field.id}-key`}
                value={field.fieldKey}
                onChange={(e) => onUpdate(field.id, { fieldKey: e.target.value })}
                placeholder="field_name"
              />
            </div>
            <div>
              <Label htmlFor={`${field.id}-type`}>Field Type</Label>
              <Select value={field.fieldType} onValueChange={(value: any) => onUpdate(field.id, { fieldType: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TEXT">Text</SelectItem>
                  <SelectItem value="DATE">Date</SelectItem>
                  <SelectItem value="NUMBER">Number</SelectItem>
                  <SelectItem value="CHECKBOX">Checkbox</SelectItem>
                  <SelectItem value="DROPDOWN">Dropdown</SelectItem>
                  <SelectItem value="SIGNATURE">Signature</SelectItem>
                  <SelectItem value="PHOTO">Photo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor={`${field.id}-label`}>Label</Label>
            <Input
              id={`${field.id}-label`}
              value={field.label}
              onChange={(e) => onUpdate(field.id, { label: e.target.value })}
              placeholder={t('form.placeholders.fieldLabel') || 'Field Label'}
            />
          </div>

          <div>
            <Label htmlFor={`${field.id}-placeholder`}>Placeholder</Label>
            <Input
              id={`${field.id}-placeholder`}
              value={field.placeholder || ''}
              onChange={(e) => onUpdate(field.id, { placeholder: e.target.value })}
              placeholder={t('form.placeholders.placeholderText') || 'Enter placeholder text'}
            />
          </div>

          {field.fieldType === 'DROPDOWN' && (
            <div>
              <Label>Options (one per line)</Label>
              <Textarea
                value={field.options?.join('\n') || ''}
                onChange={(e) => onUpdate(field.id, { 
                  options: e.target.value.split('\n').filter(Boolean) 
                })}
                placeholder={t('form.placeholders.optionsOnePerLine') || 'Option 1&#10;Option 2&#10;Option 3'}
                rows={4}
              />
            </div>
          )}

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id={`${field.id}-required`}
              checked={field.required}
              onChange={(e) => onUpdate(field.id, { required: e.target.checked })}
              className="rounded border-gray-300"
            />
            <Label htmlFor={`${field.id}-required`}>Required field</Label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export function TemplateBuilder({ template, fields = [], onSave }: TemplateBuilderProps) {
  const { t } = useLanguage();
  const [templateData, setTemplateData] = useState({
    name: template?.name || '',
    description: template?.description || '',
    type: template?.type || 'FORM' as const,
    language: template?.language || 'ro' as const,
    isActive: template?.isActive ?? true,
  });

  const [templateFields, setTemplateFields] = useState<FieldConfig[]>(
    fields.map((field, index) => ({
      id: field.id || `field-${index}`,
      fieldKey: field.fieldKey,
      fieldType: field.fieldType,
      label: field.label,
      required: field.required || false,
      placeholder: field.placeholder || '',
      options: field.options as string[] || [],
      validation: field.validation,
    }))
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const addField = useCallback(() => {
    const newField: FieldConfig = {
      id: `field-${Date.now()}`,
      fieldKey: `field_${templateFields.length + 1}`,
      fieldType: 'TEXT',
      label: `Field ${templateFields.length + 1}`,
      required: false,
      placeholder: '',
      options: [],
    };
    setTemplateFields(prev => [...prev, newField]);
  }, [templateFields.length]);

  const updateField = useCallback((id: string, updates: Partial<FieldConfig>) => {
    setTemplateFields(prev => prev.map(field => 
      field.id === id ? { ...field, ...updates } : field
    ));
  }, []);

  const deleteField = useCallback((id: string) => {
    setTemplateFields(prev => prev.filter(field => field.id !== id));
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setTemplateFields((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over?.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }, []);

  const handleSave = useCallback(() => {
    const templateToSave = {
      ...templateData,
      templateData: { fields: templateFields },
    };

    const fieldsToSave = templateFields.map((field, index) => ({
      fieldKey: field.fieldKey,
      fieldType: field.fieldType,
      label: field.label,
      required: field.required,
      placeholder: field.placeholder,
      options: field.options,
      position: index + 1,
      validation: field.validation,
    }));

    onSave(templateToSave, fieldsToSave);
  }, [templateData, templateFields, onSave]);

  const [isPreview, setIsPreview] = useState(false);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Document Template Builder</h1>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => setIsPreview(!isPreview)}
            className="flex items-center space-x-2"
          >
            <Eye className="h-4 w-4" />
            <span>{isPreview ? 'Edit' : 'Preview'}</span>
          </Button>
          <Button onClick={handleSave} className="flex items-center space-x-2">
            <Save className="h-4 w-4" />
            <span>Save Template</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Template Settings */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Template Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="template-name">Template Name</Label>
                <Input
                  id="template-name"
                  value={templateData.name}
                  onChange={(e) => setTemplateData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={t('form.placeholders.templateName') || 'Enter template name'}
                />
              </div>

              <div>
                <Label htmlFor="template-description">Description</Label>
                <Textarea
                  id="template-description"
                  value={templateData.description}
                  onChange={(e) => setTemplateData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder={t('form.placeholders.templateDesc') || 'Enter template description'}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="template-type">Template Type</Label>
                  <Select value={templateData.type} onValueChange={(value: any) => setTemplateData(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FORM">Form</SelectItem>
                      <SelectItem value="DOCUMENT">Document</SelectItem>
                      <SelectItem value="CERTIFICATE">Certificate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="template-language">Language</Label>
                  <Select value={templateData.language} onValueChange={(value: any) => setTemplateData(prev => ({ ...prev, language: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ro">Romanian</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="template-active"
                  checked={templateData.isActive}
                  onChange={(e) => setTemplateData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="template-active">Active template</Label>
              </div>
            </CardContent>
          </Card>

          {/* Field Editor */}
          {!isPreview && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Template Fields</h2>
                <Button onClick={addField} className="flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>Add Field</span>
                </Button>
              </div>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={templateFields.map(f => f.id)} strategy={verticalListSortingStrategy}>
                  {templateFields.map((field) => (
                    <SortableField
                      key={field.id}
                      field={field}
                      onUpdate={updateField}
                      onDelete={deleteField}
                    />
                  ))}
                </SortableContext>
              </DndContext>

              {templateFields.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No fields added yet. Click "Add Field" to get started.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="lg:sticky lg:top-6">
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                {templateFields.map((field) => (
                  <div key={field.id}>
                    <Label>
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    
                    {field.fieldType === 'TEXT' && (
                      <Input placeholder={field.placeholder} disabled />
                    )}
                    
                    {field.fieldType === 'DATE' && (
                      <Input type="date" disabled />
                    )}
                    
                    {field.fieldType === 'NUMBER' && (
                      <Input type="number" placeholder={field.placeholder} disabled />
                    )}
                    
                    {field.fieldType === 'CHECKBOX' && (
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" disabled className="rounded border-gray-300" />
                        <span className="text-sm text-gray-600">{field.placeholder}</span>
                      </div>
                    )}
                    
                    {field.fieldType === 'DROPDOWN' && (
                      <Select disabled>
                        <SelectTrigger>
                          <SelectValue placeholder={field.placeholder || t('form.placeholders.selectOption') || 'Select an option'} />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options?.map((option, index) => (
                            <SelectItem key={index} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    
                    {field.fieldType === 'SIGNATURE' && (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500">
                        Signature Area
                      </div>
                    )}
                    
                    {field.fieldType === 'PHOTO' && (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500">
                        Photo Upload Area
                      </div>
                    )}
                  </div>
                ))}

                {templateFields.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    Preview will appear here as you add fields
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}