import React, { InputHTMLAttributes, forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { aplicarMascara } from '@/lib/masks';

interface MaskedInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  mask: 'cnpj' | 'cpf' | 'telefone' | 'cep' | 'email';
  value: string;
  onChange: (value: string) => void;
}

/**
 * Input com máscara aplicada automaticamente
 * Uso: <MaskedInput mask="cnpj" value={cnpj} onChange={setCnpj} />
 */
export const MaskedInput = forwardRef<HTMLInputElement, MaskedInputProps>(
  ({ mask, value, onChange, ...props }, ref) => {
    const mascara = aplicarMascara(mask);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const valorMascarado = mascara(e.target.value);
      onChange(valorMascarado);
    };

    return (
      <Input
        ref={ref}
        {...props}
        value={value}
        onChange={handleChange}
      />
    );
  }
);

MaskedInput.displayName = 'MaskedInput';
