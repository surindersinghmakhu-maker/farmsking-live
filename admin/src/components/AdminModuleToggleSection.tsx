import React, { useState } from 'react';
import { useFeatureFlags } from '../context/FeatureFlagContext';
import { FeatureFlagsMap, CategoryFlag, SubCategoryFlag } from '../types/feature-flags';

export const AdminModuleToggleSection: React.FC = () => {
  const { flags, loading, updateFlags } = useFeatureFlags();
  const [localFlags, setLocalFlags] = useState<FeatureFlagsMap | null>(flags);
  const [saving, setSaving] = useState<boolean>(false);
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({
    shopping: true,
    telephony_comm: true,
    farmer_operations: true,
  });

  React.useEffect(() => {
    if (flags) {
      setLocalFlags(flags);
    }
  }, [flags]);

  if (loading || !localFlags) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-2"></div>
        <p className="text-slate-500 font-medium">ਮੋਡਿਊਲ ਸੈਟਿੰਗਜ਼ ਲੋਡ ਹੋ ਰਹੀਆਂ ਹਨ...</p>
      </div>
    );
  }

  const toggleCategory = (catKey: string) => {
    if (!localFlags) return;
    const currentCat = localFlags[catKey];
    if (!currentCat) return;

    const newFlags = {
      ...localFlags,
      [catKey]: {
        ...currentCat,
        enabled: !currentCat.enabled,
      },
    };
    setLocalFlags(newFlags);
  };

  const toggleSubCategory = (catKey: string, subKey: string) => {
    if (!localFlags) return;
    const currentCat = localFlags[catKey];
    if (!currentCat || !currentCat.subCategories) return;
    const currentSub = currentCat.subCategories[subKey];
    if (!currentSub) return;

    const newFlags = {
      ...localFlags,
      [catKey]: {
        ...currentCat,
        subCategories: {
          ...currentCat.subCategories,
          [subKey]: {
            ...currentSub,
            enabled: !currentSub.enabled,
          },
        },
      },
    };
    setLocalFlags(newFlags);
  };

  const toggleAccordion = (catKey: string) => {
    setExpandedCats((prev) => ({
      ...prev,
      [catKey]: !prev[catKey],
    }));
  };

  const handleSave = async () => {
    if (!localFlags) return;
    try {
      setSaving(true);
      await updateFlags(localFlags);
      alert('✅ ਕੈਟੇਗਰੀ ਸੈਟਿੰਗਜ਼ ਸਫਲਤਾਪੂਰਵਕ ਸੇਵ ਹੋ ਗਈਆਂ ਹਨ!');
    } catch (err) {
      alert('❌ ਸੈਟਿੰਗਜ਼ ਸੇਵ ਕਰਨ ਵੇਲੇ ਐਰਰ ਆਇਆ।');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-slate-900 text-slate-100 rounded-3xl p-6 shadow-2xl border border-slate-800">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            🛡️ Super Admin System Control
          </div>
          <h2 className="text-2xl font-extrabold text-white">Category & Sub-Category Live Switches</h2>
          <p className="text-slate-400 text-sm mt-1">
            ਕਿਸੇ ਵੀ ਮੋਡਿਊਲ ਜਾਂ ਸੁਵਿਧਾ ਨੂੰ 1-ਕਲਿੱਕ ਨਾਲ ਐਪ ਅੰਦਰ ਲਾਈਵ ON / OFF ਕਰੋ।
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-bold rounded-xl shadow-lg hover:shadow-indigo-500/25 active:scale-95 transition-all disabled:opacity-50"
        >
          {saving ? 'ਸੇਵ ਹੋ ਰਿਹਾ ਹੈ...' : '💾 Save Changes'}
        </button>
      </div>

      {/* Categories List */}
      <div className="mt-6 space-y-4">
        {Object.entries(localFlags).map(([catKey, category]: [string, CategoryFlag]) => {
          const isExpanded = !!expandedCats[catKey];
          const subCount = Object.keys(category.subCategories || {}).length;
          const activeSubCount = Object.values(category.subCategories || {}).filter(
            (s: SubCategoryFlag) => s.enabled
          ).length;

          return (
            <div
              key={catKey}
              className={`rounded-2xl border transition-all ${
                category.enabled
                  ? 'bg-slate-800/60 border-slate-700/60'
                  : 'bg-slate-950/40 border-slate-800 opacity-70'
              }`}
            >
              {/* Category Header */}
              <div className="p-4 flex items-center justify-between gap-3">
                <div
                  className="flex items-center gap-3 cursor-pointer flex-1"
                  onClick={() => toggleAccordion(catKey)}
                >
                  <span className="text-xl">{isExpanded ? '🔽' : '▶️'}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-white">{category.namePa}</h3>
                      <span className="text-xs text-slate-400 font-mono">({category.nameEn})</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Sub-categories active: {activeSubCount} / {subCount}
                    </p>
                  </div>
                </div>

                {/* Main Category Switch */}
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      category.enabled
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {category.enabled ? '● Category ON' : '○ Category OFF'}
                  </span>
                  <button
                    onClick={() => toggleCategory(catKey)}
                    className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${
                      category.enabled ? 'bg-indigo-600' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                        category.enabled ? 'translate-x-8' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Sub-categories Accordion */}
              {isExpanded && category.subCategories && (
                <div className="px-4 pb-4 pt-2 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(category.subCategories).map(
                    ([subKey, subItem]: [string, SubCategoryFlag]) => {
                      const isSubOn = category.enabled && subItem.enabled;
                      return (
                        <div
                          key={subKey}
                          className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                            isSubOn
                              ? 'bg-slate-900/80 border-slate-700'
                              : 'bg-slate-950/60 border-slate-800/60 opacity-60'
                          }`}
                        >
                          <div>
                            <p className="text-sm font-semibold text-slate-200">{subItem.namePa}</p>
                            <p className="text-xs text-slate-400 font-mono">{subItem.nameEn}</p>
                          </div>

                          <button
                            onClick={() => toggleSubCategory(catKey, subKey)}
                            disabled={!category.enabled}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              subItem.enabled && category.enabled ? 'bg-emerald-500' : 'bg-slate-700'
                            } disabled:opacity-30`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                subItem.enabled && category.enabled ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      );
                    }
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
