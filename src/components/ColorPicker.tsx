const PRESET_COLORS = [
  ["#000000", "#434343", "#666666", "#999999", "#B7B7B7", "#CCCCCC", "#D9D9D9", "#EFEFEF", "#F3F3F3", "#FFFFFF"],
  ["#980000", "#FF0000", "#FF9900", "#FFFF00", "#00FF00", "#00FFFF", "#4A86E8", "#0000FF", "#9900FF", "#FF00FF"],
];

interface ColorPickerProps {
  currentColor: string;
  onSelectColor: (color: string) => void;
  onClose: () => void;
}

function ColorPicker({ currentColor, onSelectColor, onClose }: ColorPickerProps) {
  return (
    <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-2">
      <div className="flex flex-col gap-1.5">
        {PRESET_COLORS.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-1">
            {row.map((color) => (
              <button
                key={color}
                type="button"
                title={color}
                aria-label={`Select ${color}`}
                style={{
                  backgroundColor: color,
                  width: 20,
                  height: 20,
                  borderRadius: 3,
                  border: currentColor === color ? "2px solid #1a73e8" : "1px solid #dadce0",
                  cursor: "pointer",
                  flexShrink: 0,
                  boxShadow: currentColor === color ? "0 0 0 1px #1a73e8" : "none",
                }}
                onMouseDown={(event) => {
                  event.preventDefault();
                  onSelectColor(color);
                  onClose();
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ColorPicker;
