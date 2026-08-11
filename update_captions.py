from pathlib import Path
import re

p = Path('src/index.html')
text = p.read_text(encoding='utf-8')
text = text.replace('Photography Portfolio Showcase', 'Anthony Glover Design', 1)

labels = [
    'Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune',
    'Pluto', 'Sol', 'Sirius', 'Vega', 'Polaris', 'Orion', 'Andromeda', 'Nebula'
]
quotes = [
    '"I am attempting to fundamentally alter the cultural landscape through which my generation perceives itself—not merely as entertainment, but as architects of a new aesthetic and moral order."',
    '"The singular distinction between those who flourish and those who perish is not circumstance of birth, but rather an unwavering commitment to the cultivation and refinement of one\'s particular mastery."',
    '"I have devoted myself to an obsessive pursuit of perfection in every endeavor I undertake, recognizing that excellence is not an accident but a discipline—a continuous negotiation between vision and execution."',
    '"I harbor no fear of mortal men, for such fear is a diminishment of the soul. I fear only divine judgment and the corruption of my own conscience."',
    '"We have attained that which was deemed impossible for those of our station and origin—we have transcended the geography of our birth through sheer force of will and imagination."',
    '"There exists a profound paradox at the heart of human understanding: that knowledge, while liberating, often burdens the bearer with consciousness of suffering; whereas ignorance offers a counterfeit peace that erodes the soul."',
    '"The pathway to enduring success lies not in scattered effort, but in the ruthless identification and cultivation of those gifts which nature has bestowed upon you—therein lies both authenticity and power."',
    '"I have constructed an empire from the barrenness of nothing, proving through lived experience that a man\'s origins do not circumscribe his destiny, that will and intellect can overcome any material condition."',
    '"I have walked through depths of suffering that have stripped away all illusion—and in that crucible I have learned what is genuine, what endures, and what constitutes a life worth living."',
    '"The human tongue possesses a power nearly as consequential as the sword: words can construct civilizations or reduce them to ruin; they can liberate the oppressed or enslave the willing. This is why mastery of language is the first art."',
    '"I have authored the foundational text of this age—a canon so complete and influential that it now shapes the very language and structure through which an entire generation understands itself and its possibilities."',
    '"Mortality is the universal condition, yet it separates the living from the merely alive. Most exist in a state of half-consciousness, postponing their authentic selves. To truly live is to act with full presence and intentionality in each moment."',
    '"The distinction between the merchant and the artist is fundamental: the merchant seeks profit from creation; the artist creates despite profit, knowing that the work itself is the only justification for its existence."',
    '"Rather than petition those already seated at tables of power and influence, one must possess the vision and courage to construct entirely new tables—to become not a guest in someone else\'s world, but an architect of your own."',
    '"Capital, like water, follows the laws of nature—it flows continuously, seeks its level, and concentrates where conditions allow. Understanding these movements is to understand the hidden machinery of the world itself."',
    '"There is a kingship that transcends mere crowns—it is the authority earned through excellence, through the transformation of vision into reality, and through the shaping of culture itself. To such a throne, all must finally bow."'
]

count = 0

def label_repl(match):
    global count
    value = labels[count]
    count += 1
    return f'{match.group(1)}{value}{match.group(3)}'

text, n = re.subn(r'(data-title=")([^"]+)(")', label_repl, text, count=16)
if n != 16:
    raise SystemExit(f'Expected 16 label replacements, got {n}')

count = 0

def quote_repl(match):
    global count
    value = quotes[count]
    count += 1
    return f'{match.group(1)}{value}{match.group(3)}'

text, n = re.subn(r'(<p class="preview__item-description">)([^<]+)(</p>)', quote_repl, text, count=16)
if n != 16:
    raise SystemExit(f'Expected 16 quote replacements, got {n}')

p.write_text(text, encoding='utf-8')
print('Updated title, labels, and quotes.')
