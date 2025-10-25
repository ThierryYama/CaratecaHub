import * as React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UFS } from '@/lib/ufs';

export interface EstadoSelectProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (uf: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export const EstadoSelect: React.FC<EstadoSelectProps> = ({
  id,
  name,
  value,
  onChange,
  disabled,
  placeholder = 'Selecione o estado (UF)',
  className,
}) => {
  return (
    <>
      {name ? <input type="hidden" name={name} value={value ?? ''} /> : null}
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger id={id} className={className}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {UFS.map((uf) => (
            <SelectItem key={uf.sigla} value={uf.sigla}>
              {uf.sigla} - {uf.nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
};

export default EstadoSelect;
