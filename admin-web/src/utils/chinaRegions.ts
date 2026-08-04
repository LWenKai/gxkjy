export interface DistrictOption {
  label: string;
  value: string;
}

export interface CityOption {
  label: string;
  value: string;
  districts: DistrictOption[];
}

export interface ProvinceOption {
  label: string;
  value: string;
  cities: CityOption[];
}

export const provinceOptions: ProvinceOption[] = [
  {
    label: '山西省',
    value: '山西省',
    cities: [
      {
        label: '太原市',
        value: '太原市',
        districts: [
          '小店区',
          '迎泽区',
          '杏花岭区',
          '尖草坪区',
          '万柏林区',
          '晋源区',
          '清徐县',
          '阳曲县',
          '娄烦县',
          '古交市',
        ].map(toOption),
      },
      {
        label: '大同市',
        value: '大同市',
        districts: ['平城区', '云冈区', '新荣区', '云州区', '阳高县', '天镇县', '广灵县', '灵丘县', '浑源县', '左云县'].map(toOption),
      },
      {
        label: '晋中市',
        value: '晋中市',
        districts: ['榆次区', '太谷区', '榆社县', '左权县', '和顺县', '昔阳县', '寿阳县', '祁县', '平遥县', '灵石县', '介休市'].map(toOption),
      },
      {
        label: '临汾市',
        value: '临汾市',
        districts: ['尧都区', '曲沃县', '翼城县', '襄汾县', '洪洞县', '古县', '安泽县', '浮山县', '吉县', '乡宁县', '大宁县', '隰县', '永和县', '蒲县', '汾西县', '侯马市', '霍州市'].map(toOption),
      },
      {
        label: '运城市',
        value: '运城市',
        districts: ['盐湖区', '临猗县', '万荣县', '闻喜县', '稷山县', '新绛县', '绛县', '垣曲县', '夏县', '平陆县', '芮城县', '永济市', '河津市'].map(toOption),
      },
    ],
  },
];

function toOption(value: string) {
  return { label: value, value };
}

export function splitKnownAddress(address?: string | null) {
  const fallback = {
    province: '',
    city: '',
    district: '',
    detail: address || '',
  };
  if (!address) return fallback;

  for (const province of provinceOptions) {
    if (!address.startsWith(province.value)) continue;
    const afterProvince = address.slice(province.value.length);
    for (const city of province.cities) {
      if (!afterProvince.startsWith(city.value)) continue;
      const afterCity = afterProvince.slice(city.value.length);
      for (const district of city.districts) {
        if (!afterCity.startsWith(district.value)) continue;
        return {
          province: province.value,
          city: city.value,
          district: district.value,
          detail: afterCity.slice(district.value.length),
        };
      }
      return {
        province: province.value,
        city: city.value,
        district: '',
        detail: afterCity,
      };
    }
    return {
      province: province.value,
      city: '',
      district: '',
      detail: afterProvince,
    };
  }

  return fallback;
}

export function buildFullAddress(input: {
  province?: string;
  city?: string;
  district?: string;
  detail?: string;
}) {
  return `${input.province || ''}${input.city || ''}${input.district || ''}${input.detail?.trim() || ''}`;
}
