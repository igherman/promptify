import requests
from bs4 import BeautifulSoup

def scrape_news(url):
    response = requests.get(url)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, 'html.parser')
    headline_links = []
    # Only <h2> inside <article class="post-has-image">
    for article in soup.find_all('article', class_='post-has-image'):
        h2 = article.find('h2')
        if h2:
            a = h2.find('a', href=True)
            if a and a.text.strip():
                headline_links.append((a.text.strip(), a['href']))
    return headline_links

def scrape_article(url):
    response = requests.get(url)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, 'html.parser')
    # Try to extract the title and main content
    title = soup.find('h1')
    title_text = title.text.strip() if title else 'No title found'
    # Main content is usually in <div class="article-body"> or similar
    content_div = soup.find('div', class_='entry-content')
    if not content_div:
        # Fallback: try <div class="articol"> (older HotNews structure)
        content_div = soup.find('div', class_='articol')
    content_text = content_div.get_text(separator='\n', strip=True) if content_div else 'No content found'
    return title_text, content_text

if __name__ == "__main__":
    url = "https://hotnews.ro"
    headlines = scrape_news(url)
    for idx, (title, link) in enumerate(headlines, 1):
        print(f"{idx}. {title}\n   {link}")
        # Make sure the link is absolute
        if not link.startswith('http'):
            link = 'https://www.hotnews.ro' + link
        article_title, article_content = scrape_article(link)
        print(f"   Article Title: {article_title}")
        print(f"   Article Content (first 500 chars): {article_content[:500]}...\n")