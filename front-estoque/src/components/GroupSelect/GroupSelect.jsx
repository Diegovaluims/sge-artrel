// GroupSelect.jsx
// Dropdown customizado para seleção de grupo funcional.
// Substitui <select> nativo para habilitar tooltip com ativos por grupo via onMouseEnter.
// Emite evento sintético { target: { name, value } } compatível com handleChange existente.

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import './GroupSelect.css';

const GroupSelect = forwardRef(function GroupSelect({
  id,
  name,
  value,
  onChange,
  groups = [],
  groupAssets = {},
  groupColors = {},
  required = false,
  placeholder = '— Selecione a categoria —',
}, ref) {
  const [isOpen, setIsOpen]             = useState(false);
  const [hoveredGroup, setHoveredGroup] = useState(null);
  const [tooltipStyle, setTooltipStyle] = useState({ top: 0 });
  const wrapperRef = useRef(null);
  const triggerRef = useRef(null);

  useImperativeHandle(ref, () => ({
    focus: () => {
      triggerRef.current?.focus();
      setIsOpen(true);
    }
  }));

  // Fecha ao clicar fora
  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
        setHoveredGroup(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Fecha com Escape
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setHoveredGroup(null);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  function handleSelect(groupValue) {
    onChange({ target: { name, value: groupValue } });
    setIsOpen(false);
    setHoveredGroup(null);
  }

  function handleMouseEnter(e, groupValue, assets) {
    const rect = e.currentTarget.getBoundingClientRect();
    // Calcula altura estimada com base no font-size raiz (rem) × nº de itens
    const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const itemHeight  = rootFontSize * 1.6;   // ~1.6rem por item
    const headerArea  = rootFontSize * 5;     // header + padding
    const estimatedHeight = assets.length * itemHeight + headerArea;
    const overflows = (rect.top + estimatedHeight) > window.innerHeight;
    setTooltipStyle(overflows
      ? { bottom: 0, top: 'auto' }
      : { top: 0, bottom: 'auto' }
    );
    setHoveredGroup(groupValue);
  }

  const selectedGroup = groups.find(g => g.value === value);
  const selectedColor = value ? groupColors[value] : null;

  return (
    <div
      ref={wrapperRef}
      id={id}
      className={`group-select-wrapper${isOpen ? ' open' : ''}`}
    >
      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        className="group-select-trigger"
        onClick={() => { setIsOpen(o => !o); setHoveredGroup(null); }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-required={required}
      >
        <span className="group-select-value">
          {selectedGroup ? (
            <span
              className="group-select-badge"
              style={selectedColor ? { background: selectedColor.bg, color: selectedColor.color } : {}}
            >
              {selectedGroup.label}
            </span>
          ) : (
            <span className="group-select-placeholder">{placeholder}</span>
          )}
        </span>
        <span className={`group-select-arrow${isOpen ? ' rotated' : ''}`}>▾</span>
      </button>

      {/* Lista de opções */}
      {isOpen && (
        <div className="group-select-dropdown" role="listbox">
          <div
            className={`group-select-option placeholder-opt${!value ? ' selected' : ''}`}
            role="option"
            aria-selected={!value}
            onClick={() => handleSelect('')}
          >
            {placeholder}
          </div>

          {groups.map(g => {
            const cor    = groupColors[g.value] || {};
            const assets = groupAssets[g.value] || [];

            return (
              <div
                key={g.value}
                className={`group-select-option${g.value === value ? ' selected' : ''}`}
                role="option"
                aria-selected={g.value === value}
                onMouseEnter={(e) => handleMouseEnter(e, g.value, assets)}
                onMouseLeave={() => setHoveredGroup(null)}
                onClick={() => handleSelect(g.value)}
              >
                <span
                  className="group-option-badge"
                  style={{ background: cor.bg, color: cor.color }}
                >
                  {g.label}
                </span>

                {/* Tooltip com lista de ativos */}
                {hoveredGroup === g.value && assets.length > 0 && (
                  <div className="group-tooltip" style={{ borderLeftColor: cor.color, ...tooltipStyle }}>
                    <div className="group-tooltip-header" style={{ color: cor.color }}>
                      {g.label}
                    </div>
                    <ul className="group-tooltip-list">
                      {assets.map(a => (
                        <li key={a.value} className="group-tooltip-item">
                          {a.value.replace(/_/g, ' ')}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

export default GroupSelect;

