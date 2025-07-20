"use client";

import { useState, forwardRef } from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingButtonProps extends Omit<ButtonProps, 'onClick'> {
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => Promise<void> | void;
  loadingText?: string;
  showSpinner?: boolean;
  preventDoubleClick?: boolean;
}

export const LoadingButton = forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ 
    children, 
    onClick, 
    loadingText, 
    showSpinner = true, 
    preventDoubleClick = true,
    disabled,
    className,
    ...props 
  }, ref) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
      if (isLoading || disabled) return;

      if (onClick) {
        setIsLoading(true);
        try {
          await onClick(e);
        } catch (error) {
          console.error('Button click error:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    const isDisabled = disabled || (isLoading && preventDoubleClick);

    return (
      <Button
        ref={ref}
        onClick={handleClick}
        disabled={isDisabled}
        className={cn(className)}
        {...props}
      >
        {isLoading && showSpinner && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        {isLoading && loadingText ? loadingText : children}
      </Button>
    );
  }
);

LoadingButton.displayName = 'LoadingButton'; 