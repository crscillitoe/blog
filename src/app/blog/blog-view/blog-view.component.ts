import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-blog-view',
  templateUrl: './blog-view.component.html',
  styleUrls: ['./blog-view.component.scss'],
})
export class BlogViewComponent implements OnInit {
  @Input() blogName: string;
  fullPath: string;

  ngOnInit(): void {
    this.fullPath = `assets/blog/posts/${this.blogName}.md`;
    console.log(this.fullPath);
  }
}
