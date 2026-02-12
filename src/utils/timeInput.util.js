export const formatTimeInput = (value) => {
  const cleaned = value.replace(/[^0-9]/g, '');
  
  if (cleaned.length === 0) return '';
  if (cleaned.length <= 2) return cleaned;
  
  const hours = cleaned.substring(0, 2);
  const minutes = cleaned.substring(2, 4);
  
  return `${hours}:${minutes}`;
};

export const validateTimeInput = (value) => {
  const regex = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/;
  if (!regex.test(value)) return false;
  
  const [hours, minutes] = value.split(':').map(Number);
  if (hours > 23 || minutes > 59) return false;
  
  return true;
};

export const parseTimeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

export const validateAlmuerzoRange = (timeStr) => {
  const totalMinutes = parseTimeToMinutes(timeStr);
  return totalMinutes >= 0 && totalMinutes <= 120;
};
