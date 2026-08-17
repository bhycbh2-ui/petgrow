from pathlib import Path
p=Path('scripts/apply-final-ui-api-batch-20260818.py')
s=p.read_text(encoding='utf-8')
old="""s=replace_once(s,
'''    } catch {}
    setLoading(false);
  };''',
'''    } catch (e) { setLoadError(e?.message||\"Pet톡을 불러오지 못했어요.\"); }
    setLoading(false);
  };''','CommunityFeed catch error')"""
new="""s=replace_once(s,
'''      if (nextPage > 1 && typeof window !== \"undefined\") {
        window.scrollTo({ top: 0, behavior: \"smooth\" });
      }
    } catch {}
    setLoading(false);
  };''',
'''      if (nextPage > 1 && typeof window !== \"undefined\") {
        window.scrollTo({ top: 0, behavior: \"smooth\" });
      }
    } catch (e) { setLoadError(e?.message||\"Pet톡을 불러오지 못했어요.\"); }
    setLoading(false);
  };''','CommunityFeed catch error')"""
if old not in s:
    raise SystemExit('old CommunityFeed replacement block not found')
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')
print('Prepared final batch script v2')
